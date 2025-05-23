import * as vscode from 'vscode';
import { MCPServerConfig } from '../../types';
import { McpRequest } from '../types/McpRequest';
import { McpResponse } from '../types/McpResponse';
import { McpNotification } from '../types/McpNotification';
import { httpRequest } from '../utils/httpRequest';
import { generateUUID } from '../utils/generateUUID';
import { McpLogger } from '../logger/McpLogger';

class McpServerConnection {
    private config: MCPServerConfig;
    private pendingRequests: Map<string | number, {
        resolve: (value: any) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();
    private isConnected = false;
    private connectionAttempts = 0;
    private eventEmitter = new vscode.EventEmitter<{
        type: 'connected' | 'disconnected' | 'error' | 'notification';
        data?: any;
    }>();

    public onEvent = this.eventEmitter.event;

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            McpLogger.info(`Connecting to MCP server: ${this.config.name} (${this.config.url})`);
            
            switch (this.config.protocol) {
                case 'ws':
                    throw new Error('WebSocket protocol is not supported in VSCode extension environment. Please use HTTP protocol.');
                case 'http':
                    await this.testHttpConnection();
                    this.isConnected = true;
                    break;
                case 'stdio':
                    throw new Error('STDIO protocol not implemented yet');
                default:
                    throw new Error(`Unsupported protocol: ${this.config.protocol}`);
            }

            this.isConnected = true;
            this.connectionAttempts = 0;
            this.eventEmitter.fire({ type: 'connected' });
            McpLogger.info(`Successfully connected to MCP server: ${this.config.name}`);

        } catch (error) {
            this.connectionAttempts++;
            McpLogger.error(`Failed to connect to MCP server ${this.config.name}`, error as Error);
            
            if (this.connectionAttempts < this.config.retryCount) {
                McpLogger.info(`Retrying connection to ${this.config.name} (attempt ${this.connectionAttempts + 1}/${this.config.retryCount})`);
                setTimeout(() => this.connect(), 5000);
            } else {
                this.eventEmitter.fire({ type: 'error', data: error });
                throw error;
            }
        }
    }

    private async testHttpConnection(): Promise<void> {
        const response = await httpRequest(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'test',
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'MorphMind-MCP-Client',
                        version: '1.0.0'
                    }
                }
            }),
            timeout: this.config.timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP connection test failed: ${response.status} ${response.statusText}`);
        }
    }

    private handleMessage(message: McpResponse | McpNotification): void {
        McpLogger.debug(`Received message from ${this.config.name}: ${JSON.stringify(message)}`);

        if ('id' in message && this.pendingRequests.has(message.id)) {
            const pending = this.pendingRequests.get(message.id)!;
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(message.id);

            if (message.error) {
                pending.reject(new Error(`MCP Error: ${message.error.message}`));
            } else {
                pending.resolve(message.result);
            }
        } else if ('method' in message && !('id' in message)) {
            this.eventEmitter.fire({ type: 'notification', data: message });
        }
    }

    async sendRequest(method: string, params?: any): Promise<any> {
        if (this.config.protocol !== 'http') {
            throw new Error(`Unsupported protocol for request: ${this.config.protocol}`);
        }

        const id = generateUUID();
        const request: McpRequest = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        McpLogger.debug(`Sending request to ${this.config.name}: ${JSON.stringify(request)}`);
        return this.sendHttpRequest(request);
    }

    private async sendHttpRequest(request: McpRequest): Promise<any> {
        try {
            const response = await httpRequest(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers
                },
                body: JSON.stringify(request),
                timeout: this.config.timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json() as McpResponse;
            
            if (result.error) {
                throw new Error(`MCP Error: ${result.error.message}`);
            }

            return result.result;

        } catch (error) {
            McpLogger.error(`HTTP request failed for ${this.config.name}`, error as Error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        for (const [id, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();
        
        this.isConnected = false;
        this.eventEmitter.fire({ type: 'disconnected' });
        McpLogger.info(`Disconnected from MCP server: ${this.config.name}`);
    }

    get connected(): boolean {
        return this.isConnected;
    }

    get serverName(): string {
        return this.config.name;
    }
}

export { McpServerConnection };
