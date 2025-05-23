export interface VariableData {
    name: string;
    value: any;
    type: string;
    expandable: boolean;
    children?: VariableData[];
}
