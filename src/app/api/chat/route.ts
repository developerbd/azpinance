import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { tools } from '@/lib/ai/tools';
import { generateConversationSummary } from '@/app/actions/chat/generate-summary';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } = await req.json();

        // Validate messages array
        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Filter out any invalid messages and normalize format
        const validMessages = messages
            .filter(m => m && m.role && (m.content || (m.parts && m.parts.length > 0)))
            .map(m => {
                // Ensure message has proper format for convertToModelMessages
                if (m.content && !m.parts) {
                    // Convert content-only messages to parts format
                    return {
                        ...m,
                        parts: [{ type: 'text' as const, text: m.content }]
                    };
                }
                return m;
            });

        if (validMessages.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid messages provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let systemPrompt = `You are an intelligent financial assistant for Biz Ad Finance, a company that manages forex transactions, supplier payments, invoices, and digital expenses.

Your capabilities:
- Access real-time financial data including forex transactions, invoices, supplier payments, and digital expenses
- Search for contacts (suppliers, customers, employees)
- Provide financial snapshots and metrics
- Answer questions about subscriptions and recurring payments
- Know the current date and time in the user's timezone
- Access financial account information

Guidelines:
1. Always use the appropriate tool to fetch current data - never make up numbers
2. When asked about specific data (expenses, invoices, forex, accounts), use the relevant tool
3. For digital expenses/subscriptions, use get_digital_expenses tool
4. For forex/currency questions, use get_recent_forex tool
5. For invoice questions, use get_invoice_status tool
6. For date/time questions, use get_current_date_time tool
7. For account questions, use get_financial_accounts tool
8. Provide clear, concise answers with specific numbers when available
9. If you don't have access to specific data, clearly state what you can and cannot access
10. Format currency properly: USD with $, BDT with ৳

Remember: You do NOT have memory between conversations. Each chat is independent.`;

        // If sessionId is provided and we have many messages, check if we need to generate/update summary
        if (sessionId && validMessages.length > 20) {
            const supabase = await createClient();

            // Get session summary if it exists
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('summary, message_count')
                .eq('id', sessionId)
                .single();

            // If we have a summary, add it to context
            if (session?.summary) {
                systemPrompt += `\n\nPrevious conversation summary:\n${session.summary}`;
            }

            // Generate new summary if message count is high and divisible by 20
            if (session && session.message_count > 20 && session.message_count % 20 === 0) {
                // Get all messages for summarization
                const { data: allMessages } = await supabase
                    .from('chat_messages')
                    .select('role, content')
                    .eq('session_id', sessionId)
                    .order('created_at', { ascending: true });

                if (allMessages && allMessages.length > 20) {
                    // Generate summary of older messages (exclude last 10)
                    const messagesToSummarize = allMessages.slice(0, -10);
                    const summary = await generateConversationSummary(
                        messagesToSummarize.map(m => ({
                            role: m.role as 'user' | 'assistant',
                            content: m.content
                        }))
                    );

                    // Save summary to session
                    await supabase
                        .from('chat_sessions')
                        .update({ summary })
                        .eq('id', sessionId);
                }
            }
        }

        const result = streamText({
            model: openai('gpt-4o'),
            system: systemPrompt,
            messages: convertToModelMessages(validMessages),
            tools,
            maxTokens: 2000, // Ensure we don't get cut off responses
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', (error as Error)?.message);
        return new Response(JSON.stringify({
            error: (error as Error).message || 'An error occurred processing your request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
