export interface AgentResponse {
    id: string;
    content: string;
    mcpResults?: {
        tools?: Record<string, any>;
        resources?: Record<string, any>;
        prompts?: Record<string, any>;
    };
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
}
