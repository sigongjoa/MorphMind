import { createLlmClient } from './functions/llm/createLlmClient';

export const llm = createLlmClient();

export function logError(error: any, message?: string): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message || 'Unknown error'}`);
    console.error(error);
}
