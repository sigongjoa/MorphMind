import { CodeOutput } from './CodeOutput';

export interface CodeItem {
    id: string;
    code: string;
    output?: CodeOutput;
    timestamp: string;
}
