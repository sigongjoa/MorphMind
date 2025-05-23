import { MCPServerConfig } from './MCPServerConfig';
import { MCPServerStatus } from './MCPServerStatus';
import { MCPTool } from './MCPTool';
import { MCPResource } from './MCPResource';
import { MCPPrompt } from './MCPPrompt';

export interface MCPServerInfo {
    config: MCPServerConfig;
    status: MCPServerStatus;
    lastConnected?: Date;
    lastError?: string;
    capabilities?: string[];
    tools?: MCPTool[];
    resources?: MCPResource[];
    prompts?: MCPPrompt[];
}
