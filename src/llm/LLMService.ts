import * as vscode from 'vscode';
import { LMStudioClient } from './LMStudioClient';
import { LLMConfig } from './LLMConfig';
import { LLMMessage } from './LLMMessage';

class LLMService {
    private client: LMStudioClient;
    private conversationHistory: LLMMessage[] = [];

    constructor() {
        const config = this.loadConfig();
        this.client = new LMStudioClient(config);
        this.initializeConversation();
    }

    private loadConfig(): LLMConfig {
        const workspaceConfig = vscode.workspace.getConfiguration('pythonRunnerChat');
        
        return {
            baseUrl: workspaceConfig.get<string>('llmBaseUrl', 'http://127.0.0.1:1234'),
            model: workspaceConfig.get<string>('llmModel', 'local-model'),
            temperature: workspaceConfig.get<number>('llmTemperature', 0.7),
            maxTokens: workspaceConfig.get<number>('llmMaxTokens', 2048),
            timeout: workspaceConfig.get<number>('llmTimeout', 30000)
        };
    }

    private initializeConversation(): void {
        this.conversationHistory = [
            {
                role: 'system',
                content: 'You are a helpful Python programming assistant. You can help users write, debug, and explain Python code. Be concise and practical in your responses.'
            }
        ];
    }

    async sendMessage(userMessage: string): Promise<string> {
        // 사용자 메시지를 대화 기록에 추가
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        try {
            // LM Studio로 메시지 전송
            const response = await this.client.sendMessage(this.conversationHistory);

            // 응답을 대화 기록에 추가
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            // 대화 기록이 너무 길어지면 시스템 메시지와 최근 대화만 유지
            if (this.conversationHistory.length > 20) {
                const systemMessage = this.conversationHistory[0];
                const recentMessages = this.conversationHistory.slice(-15);
                this.conversationHistory = [systemMessage, ...recentMessages];
            }

            return response;
        } catch (error) {
            console.error('LLM Service Error:', error);
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            return await this.client.testConnection();
        } catch (error) {
            console.error('LLM Service connection test failed:', error);
            return false;
        }
    }

    resetConversation(): void {
        this.initializeConversation();
    }

    reloadConfig(): void {
        const config = this.loadConfig();
        this.client.updateConfig(config);
    }

    getConversationLength(): number {
        return this.conversationHistory.length;
    }
}

export { LLMService };
