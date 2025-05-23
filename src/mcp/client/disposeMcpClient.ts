import { getMcpClient } from './getMcpClient';

async function disposeMcpClient(): Promise<void> {
    const client = getMcpClient();
    if (client) {
        await client.dispose();
    }
}

export { disposeMcpClient };
