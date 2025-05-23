import { LLMConfig } from './LLMConfig';
import { LLMRequest } from './LLMRequest';
import { LLMResponse } from './LLMResponse';
import { LLMMessage } from './LLMMessage';
import { httpPost } from './httpClient';

class LMStudioClient {
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
    }

    async sendMessage(messages: LLMMessage[]): Promise<string> {
        const request: LLMRequest = {
            model: this.config.model,
            messages: messages,
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            stream: false
        };

        try {
            const response: LLMResponse = await httpPost(
                `${this.config.baseUrl}/v1/chat/completions`,
                request,
                {
                    timeout: this.config.timeout,
                    headers: {
                        'Authorization': 'Bearer lm-studio', // LM Studio 기본값
                    }
                }
            );

            if (response.choices && response.choices.length > 0) {
                return response.choices[0].message.content;
            } else {
                throw new Error('No response received from LM Studio');
            }
        } catch (error) {
            console.error('LM Studio API Error:', error);
            throw new Error(`LM Studio 통신 오류: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const testMessages: LLMMessage[] = [
                { role: 'user', content: 'Hello' }
            ];
            
            await this.sendMessage(testMessages);
            return true;
        } catch (error) {
            console.error('LM Studio connection test failed:', error);
            return false;
        }
    }

    updateConfig(newConfig: Partial<LLMConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

export { LMStudioClient };
