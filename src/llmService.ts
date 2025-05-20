/**
 * LLM 서비스 모듈
 * OpenAI 호환 API와 통신하여 메시지를 주고받습니다.
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private apiBaseUrl: string;
  private apiKey: string = '';
  private model: string;
  private systemPrompt: string;
  private conversation: Message[] = [];
  
  constructor() {
    // 설정에서 값 가져오기
    const config = vscode.workspace.getConfiguration('pythonRunnerChat');
    this.apiBaseUrl = config.get<string>('apiUrl') || 'http://localhost:1234/v1';
    this.model = config.get<string>('model') || 'Qwen2.5-7B-Instruct-Q4_K_M';
    this.systemPrompt = config.get<string>('systemPrompt') || 'You are a helpful Python assistant.';
    
    // 시스템 프롬프트 설정
    this.conversation.push({
      role: 'system',
      content: this.systemPrompt
    });
    
    this.logMessage(LogLevel.INFO, 'LLM 서비스 초기화됨', {
      apiUrl: this.apiBaseUrl,
      model: this.model
    });
  }
  
  /**
   * 사용자 메시지 전송 및 응답 수신
   */
  public async sendMessage(message: string): Promise<string> {
    try {
      // 사용자 메시지 추가
      this.conversation.push({
        role: 'user',
        content: message
      });
      
      this.logMessage(LogLevel.INFO, '메시지 전송 시작', { message });
      
      // OpenAI 호환 API 요청 생성
      const requestBody = {
        model: this.model,
        messages: this.conversation,
        stream: false
      };
      
      // API 호출
      const response = await this.httpRequest(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = JSON.parse(response.body);
      const assistantMessage = data.choices[0].message.content;
      
      // 어시스턴트 응답 저장
      this.conversation.push({
        role: 'assistant',
        content: assistantMessage
      });
      
      this.logMessage(LogLevel.INFO, '응답 수신 완료', {
        responseLength: assistantMessage.length
      });
      
      return assistantMessage;
    } catch (error) {
      this.logMessage(LogLevel.ERROR, 'LLM API 호출 오류', error);
      return `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * HTTP 요청
   */
  private httpRequest(url: string, options: any): Promise<{statusCode: number, body: string}> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        method: options.method || 'GET',
        headers: options.headers || {},
        ...urlObj.protocol === 'https:' ? { rejectUnauthorized: false } : {}
      };
      
      const req = (urlObj.protocol === 'https:' ? https : http).request(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: res.statusCode,
              body: data
            });
          } else {
            reject(new Error(`API 오류: ${res.statusCode} - ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
  
  /**
   * 대화 내역 초기화
   */
  public resetConversation(): void {
    this.conversation = [{
      role: 'system',
      content: this.systemPrompt
    }];
    
    this.logMessage(LogLevel.INFO, '대화 내역 초기화됨');
  }
  
  /**
   * 시스템 프롬프트 변경
   */
  public setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    
    // 첫 번째 메시지(시스템 프롬프트) 업데이트
    if (this.conversation.length > 0 && this.conversation[0].role === 'system') {
      this.conversation[0].content = prompt;
    } else {
      this.conversation.unshift({
        role: 'system',
        content: prompt
      });
    }
    
    this.logMessage(LogLevel.INFO, '시스템 프롬프트 변경됨', { prompt });
  }
  
  /**
   * API URL 변경
   */
  public setApiUrl(url: string): void {
    this.apiBaseUrl = url;
    this.logMessage(LogLevel.INFO, 'API URL 변경됨', { url });
  }
  
  /**
   * 모델 변경
   */
  public setModel(model: string): void {
    this.model = model;
    this.logMessage(LogLevel.INFO, '모델 변경됨', { model });
  }
  
  /**
   * 로그 메시지 출력
   */
  private logMessage(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      message,
      data
    };
    
    // 로그 레벨에 따라 다른 콘솔 메서드 사용
    switch (level) {
      case LogLevel.DEBUG:
        console.log(JSON.stringify(logObject));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logObject));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logObject));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(logObject));
        break;
    }
  }
}
