/**
 * WebView 메시지 핸들러 모듈
 * VSCode 확장과 WebView 간의 메시지 통신을 처리합니다.
 */

import * as vscode from 'vscode';
import { LogLevel } from './types';
import * as path from 'path';
import * as fs from 'fs';
import { LLMService } from './llm/LLMService';

interface WebviewMessage {
    command: string;
    [key: string]: any;
}

interface CodeOutput {
    hasError: boolean;
    textOutput: string;
}

interface SessionData {
    id: string;
    name: string;
    codeItems: any[];
    timestamp: string;
}

interface BookmarkData {
    id: string;
    name: string;
    code: string;
    timestamp: string;
}

interface VariableData {
    name: string;
    value: any;
    type: string;
    expandable: boolean;
    children?: VariableData[];
}

class MessageHandler {
    private panel: { webview: vscode.Webview };
    private extensionPath: string;
    private pythonPath: string;
    private sessionHistory: SessionData[] = [];
    private bookmarks: BookmarkData[] = [];
    private lastExecutedCode: string = '';
    private currentVariables: VariableData[] = [];
    private llmService: LLMService;

    constructor(panel: { webview: vscode.Webview }, extensionPath: string, pythonPath: string) {
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
    async handleWebviewMessage(message: WebviewMessage): Promise<void> {
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
                case 'resetConversation':
                    this.resetConversation();
                    break;
                case 'testLMStudio':
                    await this.testLMStudioConnection();
                    break;
                default:
                    console.log(`Unknown command: ${message.command}`);
            }
        } catch (error) {
            this.logError('Error handling message', error);
        }
    }

    /**
     * 채팅 메시지 처리 - 실제 LM Studio API 호출
     */
    async handleChatMessage(text: string): Promise<void> {
        try {
            // 상태 업데이트
            this.sendMessage({
                command: 'updateStatus',
                isProcessing: true,
                status: 'LM Studio에서 응답 생성 중...'
            });

            // LM Studio API 호출
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
            this.logError('LM Studio 통신 오류', error);
            
            // 오류 메시지 표시
            this.sendMessage({
                command: 'errorOutput',
                error: `LM Studio 연결 오류: ${error instanceof Error ? error.message : String(error)}\n\nLM Studio가 실행 중인지 확인하세요 (http://127.0.0.1:1234)`
            });

            this.sendMessage({
                command: 'updateStatus',
                isProcessing: false,
                status: 'LM Studio 연결 오류'
            });
        }
    }

    /**
     * LM Studio 연결 테스트
     */
    async testLMStudioConnection(): Promise<void> {
        try {
            this.sendMessage({
                command: 'updateStatus',
                isProcessing: true,
                status: 'LM Studio 연결 테스트 중...'
            });

            const isConnected = await this.llmService.testConnection();

            if (isConnected) {
                this.sendMessage({
                    command: 'systemMessage',
                    text: '✅ LM Studio 연결 성공! (http://127.0.0.1:1234)'
                });
            } else {
                this.sendMessage({
                    command: 'errorOutput',
                    error: '❌ LM Studio 연결 실패. 서버가 실행 중인지 확인하세요.'
                });
            }

            this.sendMessage({
                command: 'updateStatus',
                isProcessing: false,
                status: isConnected ? '연결 성공' : '연결 실패'
            });
        } catch (error) {
            this.logError('LM Studio 연결 테스트 오류', error);
            
            this.sendMessage({
                command: 'errorOutput',
                error: `연결 테스트 오류: ${error instanceof Error ? error.message : String(error)}`
            });

            this.sendMessage({
                command: 'updateStatus',
                isProcessing: false,
                status: '테스트 실패'
            });
        }
    }

    /**
     * 대화 초기화
     */
    resetConversation(): void {
        this.llmService.resetConversation();
        this.sendMessage({
            command: 'systemMessage',
            text: '🔄 대화가 초기화되었습니다.'
        });
    }

    /**
     * 파이썬 코드 실행
     */
    async executeCode(code: string): Promise<void> {
        try {
            // 상태 업데이트
            this.sendMessage({
                command: 'updateStatus',
                isProcessing: true,
                status: '코드 실행 중...'
            });

            this.lastExecutedCode = code;

            // 간단한 코드 실행 시뮬레이션
            // 실제로는 파이썬 인터프리터를 실행해야 함
            const output: CodeOutput = {
                hasError: false,
                textOutput: `코드가 실행되었습니다:\n${code}\n\n출력: Python 코드 실행 완료`
            };

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

            this.sendMessage({
                command: 'errorOutput',
                error: `오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
            });

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
    async getVariables(): Promise<void> {
        try {
            // 샘플 변수 데이터
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
     * 고유 ID 생성
     */
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * 에러 로깅
     */
    logError(message: string, error: any): void {
        const timestamp = new Date().toISOString();
        const logMessage = {
            timestamp,
            level: LogLevel.ERROR,
            message,
            trace: error instanceof Error ? error.stack : String(error)
        };
        
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
    sendMessage(message: any): void {
        this.panel.webview.postMessage(message);
    }
}

export { MessageHandler };
