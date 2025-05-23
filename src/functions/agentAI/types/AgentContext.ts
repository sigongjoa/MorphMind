export interface AgentContext {
    sessionId: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        mcpData?: any;
    }>;
    mcpCapabilities: {
        availableTools: string[];
        availableResources: string[];
        availablePrompts: string[];
    };
    settings: {
        model: string;
        apiUrl: string;
        systemPrompt: string;
        mcpEnabled: boolean;
    };
}
