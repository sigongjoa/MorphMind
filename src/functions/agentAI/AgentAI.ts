import * as vscode from 'vscode';
import { getMcpClient } from '../../mcpClient';
import { httpRequest } from './httpRequest';
import { AgentLogger } from './AgentLogger';
import type { McpClient } from '../../mcpClient';
import { 
    AgentRequest, 
    AgentResponse, 
    McpToolResult, 
    AgentContext 
} from './types';

export class AgentAI {
    private mcpClient: McpClient;
    private contexts: Map<string, AgentContext> = new Map();
    private isInitialized = false;

    constructor() {
        this.mcpClient = getMcpClient();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            AgentLogger.info('Initializing Agent AI with MCP integration...');
            await this.mcpClient.initialize();
            this.isInitialized = true;
            AgentLogger.info('Agent AI with MCP integration initialized successfully');
        } catch (error) {
            AgentLogger.error('Failed to initialize Agent AI', error as Error);
            throw error;
        }
    }

    async createSession(sessionId?: string): Promise<string> {
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }

        const config = vscode.workspace.getConfiguration('pythonRunnerChat');
        
        const context: AgentContext = {
            sessionId,
            messages: [],
            mcpCapabilities: {
                availableTools: this.mcpClient.getAvailableTools().map((t: any) => t.name),
                availableResources: this.mcpClient.getAvailableResources().map((r: any) => r.name),
                availablePrompts: this.mcpClient.getAvailablePrompts().map((p: any) => p.name)
            },
            settings: {
                model: config.get<string>('model', 'Qwen2.5-7B-Instruct-Q4_K_M'),
                apiUrl: config.get<string>('apiUrl', 'http://localhost:1234/v1'),
                systemPrompt: config.get<string>('systemPrompt', 'You are a helpful Python runner.'),
                mcpEnabled: config.get<boolean>('mcpEnabled', true)
            }
        };

        this.contexts.set(sessionId, context);
        AgentLogger.info(`Created new Agent AI session: ${sessionId}`);

        return sessionId;
    }

    async processRequest(request: AgentRequest): Promise<AgentResponse> {
        try {
            AgentLogger.info(`Processing Agent AI request: ${request.id}`);
            const startTime = Date.now();

            const mcpResults = await this.collectMcpData(request);
            const enrichedPrompt = await this.buildEnrichedPrompt(request, mcpResults);
            const aiResponse = await this.callAIModel(enrichedPrompt, request.options);

            const response: AgentResponse = {
                id: request.id,
                content: aiResponse.content,
                mcpResults,
                usage: aiResponse.usage,
                finishReason: aiResponse.finishReason
            };

            const executionTime = Date.now() - startTime;
            AgentLogger.info(`Agent AI request ${request.id} completed in ${executionTime}ms`);

            return response;
        } catch (error) {
            AgentLogger.error(`Failed to process Agent AI request ${request.id}`, error as Error);
            throw error;
        }
    }

    private async collectMcpData(request: AgentRequest): Promise<{
        tools?: Record<string, any>;
        resources?: Record<string, any>;
        prompts?: Record<string, any>;
    }> {
        const results: {
            tools?: Record<string, any>;
            resources?: Record<string, any>;
            prompts?: Record<string, any>;
        } = {};

        const promises: Promise<void>[] = [];

        if (request.mcpTools && request.mcpTools.length > 0) {
            results.tools = {};
            for (const toolName of request.mcpTools) {
                promises.push(
                    this.executeMcpTool(toolName, request.context || {})
                        .then(result => {
                            results.tools![toolName] = result;
                        })
                        .catch(error => {
                            AgentLogger.error(`Failed to execute MCP tool ${toolName}`, error);
                            results.tools![toolName] = { error: error.message };
                        })
                );
            }
        }

        if (request.mcpResources && request.mcpResources.length > 0) {
            results.resources = {};
            for (const resourceUri of request.mcpResources) {
                const [serverName, ...uriParts] = resourceUri.split(':');
                const actualUri = uriParts.join(':');
                
                promises.push(
                    this.mcpClient.readResource(serverName, actualUri)
                        .then((result: any) => {
                            results.resources![resourceUri] = result;
                        })
                        .catch((error: any) => {
                            AgentLogger.error(`Failed to read MCP resource ${resourceUri}`, error);
                            results.resources![resourceUri] = { error: error.message };
                        })
                );
            }
        }

        if (request.mcpPrompts && request.mcpPrompts.length > 0) {
            results.prompts = {};
            for (const fullPromptName of request.mcpPrompts) {
                const [serverName, promptName] = fullPromptName.split(':');
                
                promises.push(
                    this.mcpClient.getPrompt(serverName, promptName, request.context || {})
                        .then((result: any) => {
                            results.prompts![fullPromptName] = result;
                        })
                        .catch((error: any) => {
                            AgentLogger.error(`Failed to get MCP prompt ${fullPromptName}`, error);
                            results.prompts![fullPromptName] = { error: error.message };
                        })
                );
            }
        }

        await Promise.all(promises);
        return results;
    }

    private async executeMcpTool(toolName: string, arguments_: any): Promise<McpToolResult> {
        const startTime = Date.now();

        try {
            AgentLogger.debug(`Executing MCP tool: ${toolName} with args: ${JSON.stringify(arguments_)}`);
            
            const result = await this.mcpClient.callTool(toolName, arguments_);
            const executionTime = Date.now() - startTime;

            return {
                success: true,
                result,
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            AgentLogger.error(`MCP tool execution failed: ${toolName}`, error as Error);

            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }

    private async buildEnrichedPrompt(request: AgentRequest, mcpResults: any): Promise<string> {
        let enrichedPrompt = request.prompt;

        if (mcpResults.tools || mcpResults.resources || mcpResults.prompts) {
            enrichedPrompt += '\n\n--- MCP Data ---\n';

            if (mcpResults.tools) {
                enrichedPrompt += '\nTool Results:\n';
                for (const [toolName, result] of Object.entries(mcpResults.tools)) {
                    enrichedPrompt += `\n${toolName}: ${JSON.stringify(result, null, 2)}\n`;
                }
            }

            if (mcpResults.resources) {
                enrichedPrompt += '\nResource Data:\n';
                for (const [resourceUri, data] of Object.entries(mcpResults.resources)) {
                    enrichedPrompt += `\n${resourceUri}: ${JSON.stringify(data, null, 2)}\n`;
                }
            }

            if (mcpResults.prompts) {
                enrichedPrompt += '\nPrompt Templates:\n';
                for (const [promptName, template] of Object.entries(mcpResults.prompts)) {
                    enrichedPrompt += `\n${promptName}: ${JSON.stringify(template, null, 2)}\n`;
                }
            }

            enrichedPrompt += '\n--- End MCP Data ---\n';
        }

        const availableTools = this.mcpClient.getAvailableTools();
        const availableResources = this.mcpClient.getAvailableResources();
        const availablePrompts = this.mcpClient.getAvailablePrompts();

        if (availableTools.length > 0 || availableResources.length > 0 || availablePrompts.length > 0) {
            enrichedPrompt += '\n\n--- Available MCP Capabilities ---\n';

            if (availableTools.length > 0) {
                enrichedPrompt += '\nAvailable Tools:\n';
                availableTools.forEach((tool: any) => {
                    enrichedPrompt += `- ${tool.name}: ${tool.description}\n`;
                });
            }

            if (availableResources.length > 0) {
                enrichedPrompt += '\nAvailable Resources:\n';
                availableResources.forEach((resource: any) => {
                    enrichedPrompt += `- ${resource.uri}: ${resource.description || resource.name}\n`;
                });
            }

            if (availablePrompts.length > 0) {
                enrichedPrompt += '\nAvailable Prompts:\n';
                availablePrompts.forEach((prompt: any) => {
                    enrichedPrompt += `- ${prompt.name}: ${prompt.description}\n`;
                });
            }

            enrichedPrompt += '\n--- End MCP Capabilities ---\n';
        }

        return enrichedPrompt;
    }

    private async callAIModel(prompt: string, options?: any): Promise<{
        content: string;
        usage?: any;
        finishReason?: string;
    }> {
        const config = vscode.workspace.getConfiguration('pythonRunnerChat');
        const apiUrl = config.get<string>('apiUrl', 'http://localhost:1234/v1');
        const model = config.get<string>('model', 'Qwen2.5-7B-Instruct-Q4_K_M');
        const systemPrompt = config.get<string>('systemPrompt', 'You are a helpful Python runner.');

        try {
            const response = await httpRequest(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: options?.temperature || 0.7,
                    max_tokens: options?.maxTokens || 2048,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.choices || result.choices.length === 0) {
                throw new Error('No response from AI model');
            }

            return {
                content: result.choices[0].message.content,
                usage: result.usage,
                finishReason: result.choices[0].finish_reason
            };
        } catch (error) {
            AgentLogger.error('AI model call failed', error as Error);
            throw error;
        }
    }

    async queryWithMcpTools(prompt: string, toolNames: string[], toolArgs?: Record<string, any>): Promise<AgentResponse> {
        const requestId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const request: AgentRequest = {
            id: requestId,
            prompt,
            mcpTools: toolNames,
            context: toolArgs || {}
        };

        return this.processRequest(request);
    }

    async queryWithMcpResources(prompt: string, resourceUris: string[]): Promise<AgentResponse> {
        const requestId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const request: AgentRequest = {
            id: requestId,
            prompt,
            mcpResources: resourceUris
        };

        return this.processRequest(request);
    }

    async queryWithMcpPrompts(prompt: string, promptNames: string[], promptArgs?: Record<string, any>): Promise<AgentResponse> {
        const requestId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const request: AgentRequest = {
            id: requestId,
            prompt,
            mcpPrompts: promptNames,
            context: promptArgs || {}
        };

        return this.processRequest(request);
    }

    async smartQuery(prompt: string, options?: {
        autoSelectTools?: boolean;
        maxTools?: number;
        context?: any;
    }): Promise<AgentResponse> {
        const requestId = `smart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        let selectedTools: string[] = [];
        let selectedResources: string[] = [];
        let selectedPrompts: string[] = [];

        if (options?.autoSelectTools) {
            selectedTools = await this.selectRelevantTools(prompt, options.maxTools || 3);
            selectedResources = await this.selectRelevantResources(prompt, options.maxTools || 3);
            selectedPrompts = await this.selectRelevantPrompts(prompt, options.maxTools || 3);
        }

        const request: AgentRequest = {
            id: requestId,
            prompt,
            mcpTools: selectedTools.length > 0 ? selectedTools : undefined,
            mcpResources: selectedResources.length > 0 ? selectedResources : undefined,
            mcpPrompts: selectedPrompts.length > 0 ? selectedPrompts : undefined,
            context: options?.context
        };

        return this.processRequest(request);
    }

    private async selectRelevantTools(prompt: string, maxCount: number): Promise<string[]> {
        const availableTools = this.mcpClient.getAvailableTools();
        
        const keywords = prompt.toLowerCase().split(/\s+/);
        const scoredTools = availableTools.map((tool: any) => {
            const toolText = `${tool.name} ${tool.description}`.toLowerCase();
            const score = keywords.reduce((acc: number, keyword: string) => {
                return acc + (toolText.includes(keyword) ? 1 : 0);
            }, 0);
            
            return { tool, score };
        });

        return scoredTools
            .filter((item: any) => item.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, maxCount)
            .map((item: any) => `${item.tool.serverId}:${item.tool.name}`);
    }

    private async selectRelevantResources(prompt: string, maxCount: number): Promise<string[]> {
        const availableResources = this.mcpClient.getAvailableResources();
        
        const keywords = prompt.toLowerCase().split(/\s+/);
        const scoredResources = availableResources.map((resource: any) => {
            const resourceText = `${resource.name} ${resource.description || ''}`.toLowerCase();
            const score = keywords.reduce((acc: number, keyword: string) => {
                return acc + (resourceText.includes(keyword) ? 1 : 0);
            }, 0);
            
            return { resource, score };
        });

        return scoredResources
            .filter((item: any) => item.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, maxCount)
            .map((item: any) => item.resource.uri);
    }

    private async selectRelevantPrompts(prompt: string, maxCount: number): Promise<string[]> {
        const availablePrompts = this.mcpClient.getAvailablePrompts();
        
        const keywords = prompt.toLowerCase().split(/\s+/);
        const scoredPrompts = availablePrompts.map(promptItem => {
            const promptText = `${promptItem.name} ${promptItem.description}`.toLowerCase();
            const score = keywords.reduce((acc, keyword) => {
                return acc + (promptText.includes(keyword) ? 1 : 0);
            }, 0);
            
            return { prompt: promptItem, score };
        });

        return scoredPrompts
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxCount)
            .map(item => `${item.prompt.serverId}:${item.prompt.name}`);
    }

    getMcpCapabilities(): {
        tools: any[];
        resources: any[];
        prompts: any[];
        connectedServers: string[];
    } {
        return {
            tools: this.mcpClient.getAvailableTools(),
            resources: this.mcpClient.getAvailableResources(),
            prompts: this.mcpClient.getAvailablePrompts(),
            connectedServers: this.mcpClient.getConnectedServers()
        };
    }

    async refreshMcpConnections(): Promise<void> {
        await this.mcpClient.refreshAllServers();
        AgentLogger.info('MCP connections refreshed');
    }

    getSession(sessionId: string): AgentContext | undefined {
        return this.contexts.get(sessionId);
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.contexts.delete(sessionId);
        AgentLogger.info(`Deleted Agent AI session: ${sessionId}`);
    }

    async dispose(): Promise<void> {
        AgentLogger.info('Disposing Agent AI...');
        
        this.contexts.clear();
        await this.mcpClient.dispose();
        this.isInitialized = false;
        
        AgentLogger.info('Agent AI disposed');
    }

    async runSelfCheck(): Promise<{ passed: boolean; results: string[] }> {
        const results: string[] = [];
        let passed = true;

        try {
            if (!this.isInitialized) {
                results.push('❌ Agent AI not initialized');
                passed = false;
            } else {
                results.push('✅ Agent AI initialized');
            }

            const mcpCheck = await this.mcpClient.runSelfCheck();
            results.push(...mcpCheck.results);
            if (!mcpCheck.passed) {
                passed = false;
            }

            const config = vscode.workspace.getConfiguration('pythonRunnerChat');
            const apiUrl = config.get<string>('apiUrl');
            const model = config.get<string>('model');
            
            if (!apiUrl) {
                results.push('❌ AI API URL not configured');
                passed = false;
            } else {
                results.push(`✅ AI API URL configured: ${apiUrl}`);
            }

            if (!model) {
                results.push('❌ AI model not configured');
                passed = false;
            } else {
                results.push(`✅ AI model configured: ${model}`);
            }

            results.push(`📊 Active sessions: ${this.contexts.size}`);

            try {
                const testResponse = await this.callAIModel('Hello, this is a test message. Please respond briefly.');
                if (testResponse.content) {
                    results.push('✅ AI model connection working');
                } else {
                    results.push('❌ AI model returned empty response');
                    passed = false;
                }
            } catch (error) {
                results.push(`❌ AI model connection failed: ${(error as Error).message}`);
                passed = false;
            }
        } catch (error) {
            results.push(`❌ Self-check failed: ${(error as Error).message}`);
            passed = false;
        }

        return { passed, results };
    }

    getDebugInfo(): any {
        return {
            initialized: this.isInitialized,
            activeSessions: this.contexts.size,
            mcpCapabilities: this.getMcpCapabilities(),
            mcpDebugInfo: this.mcpClient.getDebugInfo()
        };
    }
}
