import { McpClient } from './McpClient';

let globalMcpClient: McpClient | undefined;

function getMcpClient(): McpClient {
    if (!globalMcpClient) {
        globalMcpClient = new McpClient();
    }
    return globalMcpClient;
}

export { getMcpClient };
