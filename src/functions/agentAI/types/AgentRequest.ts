export interface AgentRequest {
    id: string;
    prompt: string;
    context?: any;
    mcpTools?: string[];
    mcpResources?: string[];
    mcpPrompts?: string[];
    options?: {
        temperature?: number;
        maxTokens?: number;
        stream?: boolean;
    };
}
