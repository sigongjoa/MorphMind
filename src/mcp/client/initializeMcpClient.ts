import { getMcpClient } from './getMcpClient';
import { McpClient } from './McpClient';

async function initializeMcpClient(): Promise<McpClient> {
    const client = getMcpClient();
    await client.initialize();
    return client;
}

export { initializeMcpClient };
