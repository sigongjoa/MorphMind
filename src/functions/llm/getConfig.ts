import * as vscode from 'vscode';

export function getConfig() {
  const config = vscode.workspace.getConfiguration('pythonRunnerChat');
  return {
    apiUrl: config.get<string>('apiUrl') || 'http://localhost:1234/v1',
    model: config.get<string>('model') || 'Qwen2.5-7B-Instruct-Q4_K_M',
    systemPrompt: config.get<string>('systemPrompt') || 'You are a helpful Python runner.',
    autoStart: config.get<boolean>('autoStart') !== false,
    openPosition: config.get<string>('openPosition') || 'right',
    historyEnabled: config.get<boolean>('historyEnabled') !== false,
    maxHistorySessions: config.get<number>('maxHistorySessions') || 10,
    maxBookmarks: config.get<number>('maxBookmarks') || 50,
    variableExplorerEnabled: config.get<boolean>('variableExplorerEnabled') !== false,
    errorAnalysisEnabled: config.get<boolean>('errorAnalysisEnabled') !== false,
    inlineResultsEnabled: config.get<boolean>('inlineResultsEnabled') !== false,
  };
}
