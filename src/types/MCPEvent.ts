import { MCPEventType } from './MCPEventType';

export interface MCPEvent {
    type: MCPEventType;
    serverName: string;
    data?: any;
    timestamp: Date;
}
