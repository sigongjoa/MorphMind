import { CodeItem } from './CodeItem';

export interface SessionData {
    id: string;
    name: string;
    codeItems: CodeItem[];
    timestamp: string;
}
