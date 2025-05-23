import { LLMMessage } from './LLMMessage';

interface LLMRequest {
    model: string;
    messages: LLMMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export { LLMRequest };
