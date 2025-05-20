/**
 * WebView 메시지 핸들러 모듈
 * VSCode 확장과 WebView 간의 메시지 통신을 처리합니다.
 */

import * as vscode from 'vscode';
import { Message, LogLevel, LogMessage, CodeOutput } from './types';
import * as path from 'path';
import * as fs from 'fs';
import { LLMService } from './llmService';

// 파이썬 인터프리터 실행 결과 처리를 위한 클래스
export class MessageHandler {
  private panel: vscode.WebviewPanel;
  private extensionPath: string;
  private pythonPath: string;
  private sessionHistory: any[] = [];
  private bookmarks: any[] = [];
  private lastExecutedCode: string = '';
  private currentVariables: any[] = [];
  private llmService: LLMService;
  
  constructor(panel: vscode.WebviewPanel, extensionPath: string, pythonPath: string) {
    this.panel = panel;
    this.extensionPath = extensionPath;
    this.pythonPath = pythonPath;
    
    // LLM 서비스 초기화
    this.llmService = new LLMService();
    
    // 패널 메시지 이벤트 핸들러 등록
    this.panel.webview.onDidReceiveMessage(this.handleWebviewMessage.bind(this));
  }
  
  /**
   * WebView에서 받은 메시지 처리
   */
  private async handleWebviewMessage(message: Message): Promise<void> {
    try {
      switch (message.command) {
        case 'runCode':
          await this.executeCode(message.code);
          break;
          
        case 'sendMessage':
          await this.handleChatMessage(message.text);
          break;
          
        case 'getVariables':
          await this.getVariables();
          break;
          
        case 'getVariableChildren':
          await this.getVariableChildren(message.variableName);
          break;
          
        case 'getSessionHistory':
          this.sendSessionHistory();
          break;
          
        case 'getBookmarks':
          this.sendBookmarks();
          break;
          
        case 'bookmarkCode':
          this.bookmarkCode(message.code, message.name);
          break;
          
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscode-python-runner');
          break;
          
        case 'newFile':
          vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
          break;
          
        case 'openFile':
          vscode.commands.executeCommand('workbench.action.files.openFile');
          break;
          
        case 'openFolder':
          vscode.commands.executeCommand('workbench.action.files.openFolder');
          break;
          
        case 'cloneRepo':
          vscode.commands.executeCommand('git.clone');
          break;
          
        case 'showProblems':
          vscode.commands.executeCommand('workbench.actions.view.problems');
          break;
          
        case 'showOutput':
          vscode.commands.executeCommand('workbench.action.output.toggleOutput');
          break;
          
        case 'startDebug':
          vscode.commands.executeCommand('workbench.action.debug.start');
          break;
          
        case 'showTerminal':
          vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
          break;
          
        case 'resetConversation':
          this.llmService.resetConversation();
          this.sendMessage({
            command: 'systemMessage',
            text: '대화가 초기화되었습니다.'
          });
          break;
          
        default:
          console.log(`Unknown command: ${message.command}`);
      }
    } catch (error) {
      this.logError('Error handling message', error);
    }
  }
  
  /**
   * 채팅 메시지 처리 - LLM API 호출
   */
  private async handleChatMessage(text: string): Promise<void> {
    try {
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: true,
        status: '응답 생성 중...'
      });
      
      // LLM API 호출하여 응답 가져오기
      const response = await this.llmService.sendMessage(text);
      
      // 응답 표시
      this.sendMessage({
        command: 'systemMessage',
        text: response
      });
      
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: false,
        status: '준비 완료'
      });
      
    } catch (error) {
      this.logError('채팅 메시지 처리 오류', error);
      
      // 오류 응답 전송
      this.sendMessage({
        command: 'errorOutput',
        error: `메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
      });
      
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: false,
        status: '오류 발생'
      });
    }
  }
  
  /**
   * 파이썬 코드 실행
   */
  private async executeCode(code: string): Promise<void> {
    try {
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: true,
        status: '코드 실행 중...'
      });
      
      this.lastExecutedCode = code;
      
      // 코드 실행 로직 구현
      // 여기서는 간단히 파이썬 스크립트를 임시 파일로 저장하고
      // 자식 프로세스를 통해 실행하는 방식으로 구현
      
      // 결과 예시
      const output: CodeOutput = {
        hasError: false,
        textOutput: '실행 결과 출력'
      };
      
      // 세션 히스토리에 추가
      this.addToSessionHistory(code, output);
      
      // 응답 전송
      this.sendMessage({
        command: 'codeOutput',
        output: output.textOutput
      });
      
      // 변수 목록 갱신
      await this.getVariables();
      
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: false,
        status: '실행 완료'
      });
    } catch (error) {
      this.logError('코드 실행 오류', error);
      
      // 오류 응답 전송
      this.sendMessage({
        command: 'errorOutput',
        error: `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
      });
      
      // 상태 업데이트
      this.sendMessage({
        command: 'updateStatus',
        isProcessing: false,
        status: '오류 발생'
      });
    }
  }
  
  /**
   * 변수 목록 조회
   */
  private async getVariables(): Promise<void> {
    try {
      // 여기서는 샘플 데이터를 사용
      // 실제로는 파이썬 인터프리터와 통신하여 변수 값을 가져와야 함
      this.currentVariables = [
        {
          name: 'counter',
          value: 42,
          type: 'int',
          expandable: false
        },
        {
          name: 'message',
          value: 'Hello World',
          type: 'str',
          expandable: false
        },
        {
          name: 'data',
          value: { summary: '[Object] with 3 items' },
          type: 'dict',
          expandable: true,
          children: [
            { name: 'data["name"]', value: 'Example', type: 'str', expandable: false },
            { name: 'data["items"]', value: [1, 2, 3], type: 'list', expandable: true },
            { name: 'data["active"]', value: true, type: 'bool', expandable: false }
          ]
        }
      ];
      
      this.sendMessage({
        command: 'variables',
        data: this.currentVariables
      });
    } catch (error) {
      this.logError('변수 목록 조회 오류', error);
    }
  }
  
  /**
   * 변수 자식 목록 조회
   */
  private async getVariableChildren(variableName: string): Promise<void> {
    try {
      // 샘플 데이터에서 자식 찾기
      const variable = this.findVariable(this.currentVariables, variableName);
      
      if (variable && variable.children) {
        this.sendMessage({
          command: 'variableChildren',
          variableName: variableName,
          data: variable.children
        });
      } else {
        // 실제로는 파이썬 인터프리터에 요청하여 자식 변수 정보를 가져와야 함
        this.sendMessage({
          command: 'variableChildren',
          variableName: variableName,
          data: []
        });
      }
    } catch (error) {
      this.logError('변수 자식 목록 조회 오류', error);
    }
  }
  
  /**
   * 변수 목록에서 특정 변수 찾기
   */
  private findVariable(variables: any[], name: string): any {
    for (const variable of variables) {
      if (variable.name === name) {
        return variable;
      }
      
      if (variable.children) {
        const found = this.findVariable(variable.children, name);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 세션 히스토리에 코드 추가
   */
  private addToSessionHistory(code: string, output: CodeOutput): void {
    // 새 세션이 없으면 생성
    if (this.sessionHistory.length === 0) {
      this.sessionHistory.push({
        id: this.generateId(),
        name: `Session ${new Date().toLocaleDateString()}`,
        codeItems: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // 최신 세션에 코드 추가
    const latestSession = this.sessionHistory[0];
    latestSession.codeItems.push({
      id: this.generateId(),
      code: code,
      output: output,
      timestamp: new Date().toISOString()
    });
    
    // 세션 저장
    this.saveSessionHistory();
  }
  
  /**
   * 세션 히스토리 저장
   */
  private saveSessionHistory(): void {
    try {
      const historyPath = path.join(this.extensionPath, 'sessionHistory.json');
      fs.writeFileSync(historyPath, JSON.stringify(this.sessionHistory, null, 2));
    } catch (error) {
      this.logError('세션 히스토리 저장 오류', error);
    }
  }
  
  /**
   * 세션 히스토리 로드
   */
  private loadSessionHistory(): void {
    try {
      const historyPath = path.join(this.extensionPath, 'sessionHistory.json');
      
      if (fs.existsSync(historyPath)) {
        const data = fs.readFileSync(historyPath, 'utf8');
        this.sessionHistory = JSON.parse(data);
      } else {
        this.sessionHistory = [];
      }
    } catch (error) {
      this.logError('세션 히스토리 로드 오류', error);
      this.sessionHistory = [];
    }
  }
  
  /**
   * 세션 히스토리 전송
   */
  private sendSessionHistory(): void {
    this.loadSessionHistory();
    
    this.sendMessage({
      command: 'sessionHistory',
      data: this.sessionHistory
    });
  }
  
  /**
   * 북마크 저장
   */
  private bookmarkCode(code: string, name: string): void {
    try {
      this.loadBookmarks();
      
      this.bookmarks.push({
        id: this.generateId(),
        name: name || `Bookmark ${new Date().toLocaleDateString()}`,
        code: code,
        timestamp: new Date().toISOString()
      });
      
      const bookmarksPath = path.join(this.extensionPath, 'bookmarks.json');
      fs.writeFileSync(bookmarksPath, JSON.stringify(this.bookmarks, null, 2));
      
      this.sendMessage({
        command: 'systemMessage',
        text: '코드가 북마크에 저장되었습니다.'
      });
      
      this.sendBookmarks();
    } catch (error) {
      this.logError('북마크 저장 오류', error);
    }
  }
  
  /**
   * 북마크 로드
   */
  private loadBookmarks(): void {
    try {
      const bookmarksPath = path.join(this.extensionPath, 'bookmarks.json');
      
      if (fs.existsSync(bookmarksPath)) {
        const data = fs.readFileSync(bookmarksPath, 'utf8');
        this.bookmarks = JSON.parse(data);
      } else {
        this.bookmarks = [];
      }
    } catch (error) {
      this.logError('북마크 로드 오류', error);
      this.bookmarks = [];
    }
  }
  
  /**
   * 북마크 전송
   */
  private sendBookmarks(): void {
    this.loadBookmarks();
    
    this.sendMessage({
      command: 'bookmarks',
      data: this.bookmarks
    });
  }
  
  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * 로그 메시지 생성
   */
  private createLogMessage(level: LogLevel, message: string, error?: any): LogMessage {
    const timestamp = new Date().toISOString();
    const logMessage: LogMessage = {
      timestamp,
      level,
      message
    };
    
    if (error) {
      logMessage.trace = error instanceof Error ? error.stack : String(error);
    }
    
    return logMessage;
  }
  
  /**
   * 에러 로깅
   */
  private logError(message: string, error: any): void {
    const logMessage = this.createLogMessage(LogLevel.ERROR, message, error);
    console.error(JSON.stringify(logMessage));
    
    // WebView에 오류 상태 전송
    this.sendMessage({
      command: 'showStatus',
      type: 'error',
      text: `오류: ${message}`
    });
  }
  
  /**
   * WebView에 메시지 전송
   */
  public sendMessage(message: any): void {
    this.panel.webview.postMessage(message);
  }
}
