export interface MCPServerConfig {
    name: string;
    url: string;
    protocol: 'http' | 'ws' | 'stdio';
    enabled: boolean;
    timeout: number;
    retryCount: number;
    headers?: Record<string, string>;
    auth?: {
        type: 'bearer' | 'basic' | 'api-key';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
    };
}
