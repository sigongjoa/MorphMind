interface McpRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}

export { McpRequest };
