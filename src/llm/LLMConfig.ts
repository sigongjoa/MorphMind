interface LLMConfig {
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
}

export { LLMConfig };
