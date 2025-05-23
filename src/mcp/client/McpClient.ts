import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { MCPServerStatus, MCPServerConfig, MCPServerInfo, MCPTool, MCPResource, MCPPrompt } from '../../types';
import { McpToolInternal } from '../types/McpToolInternal';
import { McpResourceInternal } from '../types/McpResourceInternal';
import { McpPromptInternal } from '../types/McpPromptInternal';
import { McpNotification } from '../types/McpNotification';
import { McpServerConnection } from '../connection/McpServerConnection';
import { McpLogger } from '../logger/McpLogger';

class McpClient extends EventEmitter {
    private connections: Map<string, McpServerConnection> = new Map();
    private serverInfos: Map<string, MCPServerInfo> = new Map();
    private tools: Map<string, McpToolInternal> = new Map();
    private resources: Map<string, McpResourceInternal> = new Map();
    private prompts: Map<string, McpPromptInternal> = new Map();
    private isInitialized = false;

    constructor() {
        super();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            McpLogger.info('Initializing MCP Client...');
            
            const config = vscode.workspace.getConfiguration('pythonRunnerChat');
            const mcpEnabled = config.get<boolean>('mcpEnabled', true);
            
            if (!mcpEnabled) {
                McpLogger.info('MCP functionality is disabled');
                return;
            }

            const serverConfigs = config.get<MCPServerConfig[]>('mcpServers', []);
            const autoConnect = config.get<boolean>('mcpAutoConnect', true);

            for (const serverConfig of serverConfigs) {
                if (serverConfig.enabled) {
                    const connection = new McpServerConnection(serverConfig);
                    const serverInfo: MCPServerInfo = {
                        config: serverConfig,
                        status: MCPServerStatus.DISCONNECTED,
                        tools: [],
                        resources: [],
                        prompts: []
                    };

                    this.connections.set(serverConfig.name, connection);
                    this.serverInfos.set(serverConfig.name, serverInfo);

                    connection.onEvent((event) => {
                        this.handleServerEvent(serverConfig.name, event);
                    });

                    this.emit('serverAdded', serverConfig.name);

                    if (autoConnect) {
                        try {
                            serverInfo.status = MCPServerStatus.CONNECTING;
                            this.emit('statusChanged', serverConfig.name, serverInfo.status);
                            
                            await connection.connect();
                            await this.discoverCapabilities(serverConfig.name);
                            
                            serverInfo.status = MCPServerStatus.CONNECTED;
                            serverInfo.lastConnected = new Date();
                            this.emit('statusChanged', serverConfig.name, serverInfo.status);
                        } catch (error) {
                            McpLogger.error(`Failed to connect to server ${serverConfig.name}`, error as Error);
                            serverInfo.status = MCPServerStatus.ERROR;
                            serverInfo.lastError = (error as Error).message;
                            this.emit('statusChanged', serverConfig.name, serverInfo.status);
                        }
                    }
                }
            }

            this.isInitialized = true;
            McpLogger.info('MCP Client initialized successfully');

        } catch (error) {
            McpLogger.error('Failed to initialize MCP Client', error as Error);
            throw error;
        }
    }

    private handleServerEvent(serverName: string, event: { type: string; data?: any }): void {
        const serverInfo = this.serverInfos.get(serverName);
        if (!serverInfo) return;

        switch (event.type) {
            case 'connected':
                McpLogger.info(`Server ${serverName} connected`);
                serverInfo.status = MCPServerStatus.CONNECTED;
                serverInfo.lastConnected = new Date();
                this.emit('statusChanged', serverName, serverInfo.status);
                break;
            case 'disconnected':
                McpLogger.info(`Server ${serverName} disconnected`);
                serverInfo.status = MCPServerStatus.DISCONNECTED;
                this.clearServerCapabilities(serverName);
                this.emit('statusChanged', serverName, serverInfo.status);
                break;
            case 'error':
                McpLogger.error(`Server ${serverName} error`, event.data);
                serverInfo.status = MCPServerStatus.ERROR;
                serverInfo.lastError = event.data?.message || 'Unknown error';
                this.emit('statusChanged', serverName, serverInfo.status);
                break;
            case 'notification':
                this.handleNotification(serverName, event.data);
                this.emit('notification', {
                    serverName,
                    method: event.data?.method,
                    params: event.data?.params
                });
                break;
        }
    }

    private handleNotification(serverName: string, notification: McpNotification): void {
        McpLogger.debug(`Received notification from ${serverName}: ${notification.method}`);
        
        switch (notification.method) {
            case 'notifications/tools/list_changed':
                this.refreshToolsFromServer(serverName);
                break;
            case 'notifications/resources/list_changed':
                this.refreshResourcesFromServer(serverName);
                break;
            case 'notifications/prompts/list_changed':
                this.refreshPromptsFromServer(serverName);
                break;
        }
    }

    private async discoverCapabilities(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        if (!connection || !connection.connected) {
            return;
        }

        try {
            McpLogger.info(`Discovering capabilities for server: ${serverName}`);

            await connection.sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {}
                },
                clientInfo: {
                    name: 'MorphMind-MCP-Client',
                    version: '1.0.0'
                }
            });

            await this.refreshToolsFromServer(serverName);
            await this.refreshResourcesFromServer(serverName);
            await this.refreshPromptsFromServer(serverName);

            McpLogger.info(`Capabilities discovered for server: ${serverName}`);

        } catch (error) {
            McpLogger.error(`Failed to discover capabilities for ${serverName}`, error as Error);
        }
    }

    private async refreshToolsFromServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        const serverInfo = this.serverInfos.get(serverName);
        if (!connection || !connection.connected || !serverInfo) {
            return;
        }

        try {
            const result = await connection.sendRequest('tools/list');
            
            for (const [key, tool] of this.tools.entries()) {
                if (tool.serverId === serverName) {
                    this.tools.delete(key);
                }
            }

            serverInfo.tools = [];
            if (result && result.tools) {
                for (const tool of result.tools) {
                    const mcpTool: McpToolInternal = {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                        outputSchema: tool.outputSchema,
                        serverId: serverName
                    };
                    this.tools.set(`${serverName}:${tool.name}`, mcpTool);
                    serverInfo.tools.push(mcpTool as MCPTool);
                }
            }

            McpLogger.info(`Refreshed ${result?.tools?.length || 0} tools from server: ${serverName}`);

        } catch (error) {
            McpLogger.error(`Failed to refresh tools from ${serverName}`, error as Error);
        }
    }

    private async refreshResourcesFromServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        const serverInfo = this.serverInfos.get(serverName);
        if (!connection || !connection.connected || !serverInfo) {
            return;
        }

        try {
            const result = await connection.sendRequest('resources/list');
            
            for (const [key, resource] of this.resources.entries()) {
                if (resource.serverId === serverName) {
                    this.resources.delete(key);
                }
            }

            serverInfo.resources = [];
            if (result && result.resources) {
                for (const resource of result.resources) {
                    const mcpResourceInternal: McpResourceInternal = {
                        uri: resource.uri,
                        name: resource.name,
                        description: resource.description,
                        mimeType: resource.mimeType,
                        serverId: serverName
                    };
                    this.resources.set(resource.uri, mcpResourceInternal);
                    serverInfo.resources.push(mcpResourceInternal as MCPResource);
                }
            }

            McpLogger.info(`Refreshed ${result?.resources?.length || 0} resources from server: ${serverName}`);

        } catch (error) {
            McpLogger.error(`Failed to refresh resources from ${serverName}`, error as Error);
        }
    }

    private async refreshPromptsFromServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        const serverInfo = this.serverInfos.get(serverName);
        if (!connection || !connection.connected || !serverInfo) {
            return;
        }

        try {
            const result = await connection.sendRequest('prompts/list');
            
            for (const [key, prompt] of this.prompts.entries()) {
                if (prompt.serverId === serverName) {
                    this.prompts.delete(key);
                }
            }

            serverInfo.prompts = [];
            if (result && result.prompts) {
                for (const prompt of result.prompts) {
                    const mcpPromptInternal: McpPromptInternal = {
                        name: prompt.name,
                        description: prompt.description,
                        arguments: prompt.arguments,
                        serverId: serverName
                    };
                    this.prompts.set(`${serverName}:${prompt.name}`, mcpPromptInternal);
                    serverInfo.prompts.push(mcpPromptInternal as MCPPrompt);
                }
            }

            McpLogger.info(`Refreshed ${result?.prompts?.length || 0} prompts from server: ${serverName}`);

        } catch (error) {
            McpLogger.error(`Failed to refresh prompts from ${serverName}`, error as Error);
        }
    }

    private clearServerCapabilities(serverName: string): void {
        const serverInfo = this.serverInfos.get(serverName);
        if (serverInfo) {
            serverInfo.tools = [];
            serverInfo.resources = [];
            serverInfo.prompts = [];
        }

        for (const [key, tool] of this.tools.entries()) {
            if (tool.serverId === serverName) {
                this.tools.delete(key);
            }
        }

        for (const [key, resource] of this.resources.entries()) {
            if (resource.serverId === serverName) {
                this.resources.delete(key);
            }
        }

        for (const [key, prompt] of this.prompts.entries()) {
            if (prompt.serverId === serverName) {
                this.prompts.delete(key);
            }
        }
    }

    async callTool(toolName: string, arguments_: any = {}): Promise<any> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
        }

        const connection = this.connections.get(tool.serverId);
        if (!connection || !connection.connected) {
            throw new Error(`Server not connected: ${tool.serverId}`);
        }

        try {
            McpLogger.info(`Calling tool: ${toolName} with arguments: ${JSON.stringify(arguments_)}`);
            
            const result = await connection.sendRequest('tools/call', {
                name: tool.name,
                arguments: arguments_
            });

            McpLogger.debug(`Tool ${toolName} result: ${JSON.stringify(result)}`);
            return result;

        } catch (error) {
            McpLogger.error(`Failed to call tool ${toolName}`, error as Error);
            throw error;
        }
    }

    async readResource(serverName: string, uri: string): Promise<any> {
        const connection = this.connections.get(serverName);
        if (!connection || !connection.connected) {
            throw new Error(`Server not connected: ${serverName}`);
        }

        try {
            McpLogger.info(`Reading resource: ${uri} from server: ${serverName}`);
            
            const result = await connection.sendRequest('resources/read', {
                uri: uri
            });

            McpLogger.debug(`Resource ${uri} retrieved successfully`);
            return result;

        } catch (error) {
            McpLogger.error(`Failed to read resource ${uri}`, error as Error);
            throw error;
        }
    }

    async getPrompt(serverName: string, promptName: string, arguments_: any = {}): Promise<any> {
        const connection = this.connections.get(serverName);
        if (!connection || !connection.connected) {
            throw new Error(`Server not connected: ${serverName}`);
        }

        try {
            McpLogger.info(`Getting prompt: ${promptName} from server: ${serverName} with arguments: ${JSON.stringify(arguments_)}`);
            
            const result = await connection.sendRequest('prompts/get', {
                name: promptName,
                arguments: arguments_
            });

            McpLogger.debug(`Prompt ${promptName} retrieved successfully`);
            return result;

        } catch (error) {
            McpLogger.error(`Failed to get prompt ${promptName}`, error as Error);
            throw error;
        }
    }

    getServers(): MCPServerInfo[] {
        return Array.from(this.serverInfos.values());
    }

    getServer(serverName: string): MCPServerInfo | undefined {
        return this.serverInfos.get(serverName);
    }

    async connectToServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        const serverInfo = this.serverInfos.get(serverName);
        
        if (!connection || !serverInfo) {
            throw new Error(`Server not configured: ${serverName}`);
        }

        if (connection.connected) {
            McpLogger.info(`Already connected to server: ${serverName}`);
            return;
        }

        try {
            serverInfo.status = MCPServerStatus.CONNECTING;
            this.emit('statusChanged', serverName, serverInfo.status);
            
            await connection.connect();
            await this.discoverCapabilities(serverName);
            
            serverInfo.status = MCPServerStatus.CONNECTED;
            serverInfo.lastConnected = new Date();
            this.emit('statusChanged', serverName, serverInfo.status);
        } catch (error) {
            serverInfo.status = MCPServerStatus.ERROR;
            serverInfo.lastError = (error as Error).message;
            this.emit('statusChanged', serverName, serverInfo.status);
            throw error;
        }
    }

    async disconnectFromServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        const serverInfo = this.serverInfos.get(serverName);
        
        if (!connection || !serverInfo) {
            throw new Error(`Server not found: ${serverName}`);
        }

        await connection.disconnect();
        serverInfo.status = MCPServerStatus.DISCONNECTED;
        this.emit('statusChanged', serverName, serverInfo.status);
    }

    async disconnectAllServers(): Promise<void> {
        for (const [serverName, connection] of this.connections.entries()) {
            try {
                await connection.disconnect();
                const serverInfo = this.serverInfos.get(serverName);
                if (serverInfo) {
                    serverInfo.status = MCPServerStatus.DISCONNECTED;
                    this.emit('statusChanged', serverName, serverInfo.status);
                }
            } catch (error) {
                McpLogger.error(`Error disconnecting server ${serverName}`, error as Error);
            }
        }
    }

    async removeServer(serverName: string): Promise<void> {
        const connection = this.connections.get(serverName);
        if (connection) {
            try {
                await connection.disconnect();
            } catch (error) {
                McpLogger.error(`Error disconnecting server ${serverName} during removal`, error as Error);
            }
        }

        this.connections.delete(serverName);
        this.serverInfos.delete(serverName);
        this.clearServerCapabilities(serverName);
        this.emit('serverRemoved', serverName);
    }

    getAvailableTools(): McpToolInternal[] {
        return Array.from(this.tools.values());
    }

    getAvailableResources(): McpResourceInternal[] {
        return Array.from(this.resources.values());
    }

    getAvailablePrompts(): McpPromptInternal[] {
        return Array.from(this.prompts.values());
    }

    getConnectedServers(): string[] {
        return Array.from(this.connections.entries())
            .filter(([_, connection]) => connection.connected)
            .map(([name, _]) => name);
    }

    async refreshAllServers(): Promise<void> {
        for (const [serverName, connection] of this.connections.entries()) {
            if (connection.connected) {
                try {
                    await this.discoverCapabilities(serverName);
                } catch (error) {
                    McpLogger.error(`Failed to refresh server ${serverName}`, error as Error);
                }
            }
        }
    }

    async dispose(): Promise<void> {
        McpLogger.info('Disposing MCP Client...');
        
        for (const [_, connection] of this.connections.entries()) {
            try {
                await connection.disconnect();
            } catch (error) {
                McpLogger.error('Error disconnecting server', error as Error);
            }
        }

        this.connections.clear();
        this.serverInfos.clear();
        this.tools.clear();
        this.resources.clear();
        this.prompts.clear();
        this.isInitialized = false;

        McpLogger.info('MCP Client disposed');
    }

    getDebugInfo(): any {
        return {
            initialized: this.isInitialized,
            servers: Array.from(this.connections.entries()).map(([name, connection]) => ({
                name,
                connected: connection.connected
            })),
            tools: this.tools.size,
            resources: this.resources.size,
            prompts: this.prompts.size
        };
    }

    async runSelfCheck(): Promise<{ passed: boolean; results: string[] }> {
        const results: string[] = [];
        let passed = true;

        try {
            if (!this.isInitialized) {
                results.push('❌ MCP Client not initialized');
                passed = false;
            } else {
                results.push('✅ MCP Client initialized');
            }

            const config = vscode.workspace.getConfiguration('pythonRunnerChat');
            const mcpEnabled = config.get<boolean>('mcpEnabled', true);
            
            if (!mcpEnabled) {
                results.push('⚠️ MCP functionality disabled in settings');
            } else {
                results.push('✅ MCP functionality enabled');
            }

            const connectedCount = this.getConnectedServers().length;
            if (connectedCount === 0) {
                results.push('⚠️ No MCP servers connected');
            } else {
                results.push(`✅ ${connectedCount} MCP server(s) connected`);
            }

            results.push(`📊 Available tools: ${this.tools.size}`);
            results.push(`📁 Available resources: ${this.resources.size}`);
            results.push(`📝 Available prompts: ${this.prompts.size}`);

            for (const serverName of this.getConnectedServers()) {
                try {
                    const connection = this.connections.get(serverName);
                    if (connection && connection.connected) {
                        results.push(`✅ Server ${serverName} responding`);
                    }
                } catch (error) {
                    results.push(`❌ Server ${serverName} not responding: ${(error as Error).message}`);
                    passed = false;
                }
            }

        } catch (error) {
            results.push(`❌ Self-check failed: ${(error as Error).message}`);
            passed = false;
        }

        return { passed, results };
    }
}

export { McpClient };
