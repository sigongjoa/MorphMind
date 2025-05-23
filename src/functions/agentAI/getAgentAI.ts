import { AgentAI } from './AgentAI';

let globalAgentAI: AgentAI | undefined;

export function getAgentAI(): AgentAI {
    if (!globalAgentAI) {
        globalAgentAI = new AgentAI();
    }
    return globalAgentAI;
}
