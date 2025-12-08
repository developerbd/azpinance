'use server';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export async function generateConversationSummary(messages: Message[]): Promise<string> {
    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'), // Use cheaper model for summarization
            prompt: `Summarize the following conversation concisely. Focus on:
- Main topics discussed
- Key questions asked by the user
- Important data points or numbers mentioned
- Decisions or conclusions reached

Keep the summary under 150 tokens. Format as bullet points.

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Summary:`,
        });

        return text;
    } catch (error) {
        console.error('Error generating summary:', error);
        return 'Previous conversation covered financial topics.';
    }
}
