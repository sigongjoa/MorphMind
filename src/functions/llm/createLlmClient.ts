import { OpenAI } from 'openai';
import * as vscode from 'vscode';
import { getConfig } from './getConfig';

export function createLlmClient() {
  const { apiUrl } = getConfig();
  
  const config = vscode.workspace.getConfiguration('pythonRunnerChat');
  const apiKey = config.get<string>('apiKey') || 'not-needed';
  
  return new OpenAI({
    baseURL: apiUrl,
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
}
