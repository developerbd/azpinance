import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { tools } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const fs = require('fs');
    fs.writeFileSync('/Users/bizmappers/Desktop/Antigravity/Biz Ad Finance/debug_chat_request.log', new Date().toISOString() + ': Request received\n', { flag: 'a' });

    try {
        const { messages } = await req.json();

        const result = streamText({
            model: openai('gpt-4o'),
            system: `You are an intelligent financial assistant for "Biz Ad Finance", a business finance management application.
    
    Your capabilities:
    - You help users with financial questions, calculations, and reporting.
    - You act as a helpful, professional, and concise assistant.
    - You MUST use the provided tools to fetch real data when answering questions about expenses, payments, or contacts. 
    - Always "Search Contacts" first if the user mentions a name but you don't have the ID.
    
    Permissions:
    - You are running on the server with the user's authentication. 
    - If a tool returns an error or empty data, it might mean permission denied or no data found. Communicate this clearly.
    
    Tone:
    - Professional, helpful, and data-driven.
    `,
            messages,
            tools,
            maxSteps: 5, // Allow up to 5 steps for tool chaining (e.g. search -> get details)
        });

        return result.toDataStreamResponse();
    } catch (error) {
        const errorMsg = (error as Error).message + (error as any).stack;
        console.error('Chat API Error:', error);
        // Write to file for debugging
        const fs = require('fs');
        fs.writeFileSync('debug_chat_error.log', new Date().toISOString() + ': ' + errorMsg + '\n', { flag: 'a' });

        return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
