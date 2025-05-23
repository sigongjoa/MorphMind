import { getAgentAI } from './getAgentAI';
import { AgentAI } from './AgentAI';

export async function initializeAgentAI(): Promise<AgentAI> {
    const agent = getAgentAI();
    await agent.initialize();
    return agent;
}
