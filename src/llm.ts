import { OpenAI } from 'openai';
import * as vscode from 'vscode';

// LLM 설정 가져오기
function getConfig() {
  const config = vscode.workspace.getConfiguration('pythonRunnerChat');
  return {
    apiUrl: config.get<string>('apiUrl') || 'http://localhost:1234/v1',
    model: config.get<string>('model') || 'Qwen2.5-7B-Instruct-Q4_K_M',
    systemPrompt: config.get<string>('systemPrompt') || 'You are a helpful Python runner.',
    autoStart: config.get<boolean>('autoStart') !== false, // 기본값은 true
    openPosition: config.get<string>('openPosition') || 'right',
    historyEnabled: config.get<boolean>('historyEnabled') !== false, // 기본값은 true
    maxHistorySessions: config.get<number>('maxHistorySessions') || 10,
    maxBookmarks: config.get<number>('maxBookmarks') || 50,
    variableExplorerEnabled: config.get<boolean>('variableExplorerEnabled') !== false, // 기본값은 true
    errorAnalysisEnabled: config.get<boolean>('errorAnalysisEnabled') !== false, // 기본값은 true
    inlineResultsEnabled: config.get<boolean>('inlineResultsEnabled') !== false, // 기본값은 true
  };
}

// LM Studio 클라이언트 생성 함수
export function createLlmClient() {
  const { apiUrl } = getConfig();
  
  // LM Studio 설정을 가져옵니다
  const config = vscode.workspace.getConfiguration('pythonRunnerChat');
  const apiKey = config.get<string>('apiKey') || 'not-needed';
  
  // LLM 클라이언트 생성 및 반환
  return new OpenAI({
    baseURL: apiUrl,
    apiKey: apiKey,  // config에서 키를 가져오거나 기본값 사용
    dangerouslyAllowBrowser: true // 브라우저 환경에서도 작동하도록 설정
  });
}

// 현재 설정으로 LLM 클라이언트 생성
export let llm = createLlmClient();

// 설정 변경 시 LLM 클라이언트 재생성
export function refreshLlmClient() {
  llm = createLlmClient();
  return llm;
}

// 현재 설정 값 가져오기
export function getCurrentConfig() {
  return getConfig();
}

// 에러 발생 시 로깅 함수
export function logError(error: any, message: string = 'LLM API 오류'): void {
  const timestamp = new Date().toISOString();
  const errorObj = {
    timestamp,
    level: 'ERROR',
    message,
    trace: error.stack || error.toString()
  };
  
  console.error(JSON.stringify(errorObj, null, 2));
}