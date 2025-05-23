import * as vscode from 'vscode';

class McpLogger {
    private static outputChannel: vscode.OutputChannel;

    static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('MCP Client');
        }
    }

    static error(message: string, error?: Error): void {
        this.initialize();
        const timestamp = new Date().toISOString();
        const errorText = error ? `\nERROR DETAILS:\n${error.stack || error.message}` : '';
        const logMessage = `[${timestamp}] [ERROR] ${message}${errorText}`;
        
        this.outputChannel.appendLine(logMessage);
        console.error(logMessage);
    }

    static info(message: string): void {
        this.initialize();
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [INFO] ${message}`;
        
        this.outputChannel.appendLine(logMessage);
        console.log(logMessage);
    }

    static debug(message: string): void {
        this.initialize();
        const config = vscode.workspace.getConfiguration('pythonRunnerChat');
        const logLevel = config.get<string>('mcpLogLevel', 'info');
        
        if (logLevel === 'debug') {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [DEBUG] ${message}`;
            
            this.outputChannel.appendLine(logMessage);
            console.log(logMessage);
        }
    }
}

export { McpLogger };
