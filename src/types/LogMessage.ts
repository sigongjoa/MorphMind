import { LogLevel } from './LogLevel';

export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    trace?: string;
}
