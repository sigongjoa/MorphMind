import { getAgentAI } from './getAgentAI';

let globalAgentAI: any = undefined;

export async function disposeAgentAI(): Promise<void> {
    if (globalAgentAI) {
        await globalAgentAI.dispose();
        globalAgentAI = undefined;
    }
}
