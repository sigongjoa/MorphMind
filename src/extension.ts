/**
 * Python Runner Extension (수정된 버전)
 * VSCode에서 Python 코드를 대화식으로 실행하고 결과를 확인할 수 있는 확장
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { LogLevel } from './types';
import { initializeMcpClient, disposeMcpClient } from './mcpClient';
import { PythonRunnerWebviewProvider } from './webviewProvider';

/**
 * 확장 활성화 시 호출되는 함수
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('Python Runner Extension with MCP 활성화됨');

    // WebView 제공자 생성
    const provider = new PythonRunnerWebviewProvider(context.extensionUri, context.extensionPath);

    // MCP 클라이언트 초기화
    try {
        const config = vscode.workspace.getConfiguration('pythonRunnerChat');
        const mcpEnabled = config.get<boolean>('mcpEnabled', true);
        
        if (mcpEnabled) {
            // MCP 클라이언트 초기화
            const mcpClient = await initializeMcpClient();
            logMessage(LogLevel.INFO, 'MCP 클라이언트 초기화 완료');

            // 자기검증 체크 실행
            const mcpCheck = await mcpClient.runSelfCheck();
            
            if (!mcpCheck.passed) {
                logMessage(LogLevel.WARN, 'MCP 시스템 자기검증에서 문제 발견');
                mcpCheck.results.forEach(result => logMessage(LogLevel.INFO, result));
            } else {
                logMessage(LogLevel.INFO, 'MCP 시스템 자기검증 통과');
            }
        }
    } catch (error) {
        logMessage(LogLevel.ERROR, 'MCP 시스템 초기화 실패', getErrorTrace(error));
        vscode.window.showErrorMessage('MCP 기능 초기화에 실패했습니다. 설정을 확인해주세요.');
    }

    // 명령 등록: Python Runner 열기
    const openCommand = vscode.commands.registerCommand('extension.openChat', () => {
        // WebView 패널 생성
        const panel = provider.createWebviewPanel(context);
        
        // 시스템 메시지 전송
        provider.sendMessage({
            command: 'systemMessage',
            text: 'Python Runner가 시작되었습니다!\n\n🔗 LM Studio 연결 테스트: 우상단 연결 아이콘 클릭\n⚙️ 설정 변경: Ctrl+Shift+P → "Configure LM Studio"\n\n코드를 입력하고 실행해보세요.'
        });

        // 로그 출력
        logMessage(LogLevel.INFO, 'Python Runner 패널이 열림');
    });

    // 명령 등록: 현재 선택된 코드 실행
    const runSelectionCommand = vscode.commands.registerCommand('pythonRunnerChat.executeCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('열린 에디터가 없습니다.');
            return;
        }

        // 선택된 텍스트 가져오기
        const selection = editor.selection;
        let code = editor.document.getText(selection);

        // 선택된 텍스트가 없으면 전체 문서 사용
        if (code.trim() === '') {
            code = editor.document.getText();
        }

        // 웹뷰 패널 생성 또는 가져오기
        const panel = provider.createWebviewPanel(context);

        // 코드 실행 메시지 전송
        provider.sendMessage({
            command: 'runCode',
            code: code
        });

        logMessage(LogLevel.INFO, '선택된 코드 실행');
    });

    // 추가 명령 등록
    const openFileCommand = vscode.commands.registerCommand('pythonRunnerChat.openFile', () => {
        vscode.commands.executeCommand('workbench.action.files.openFile');
    });

    const newFileCommand = vscode.commands.registerCommand('pythonRunnerChat.newFile', () => {
        vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
    });

    const openFolderCommand = vscode.commands.registerCommand('pythonRunnerChat.openFolder', () => {
        vscode.commands.executeCommand('workbench.action.files.openFolder');
    });

    const cloneRepoCommand = vscode.commands.registerCommand('pythonRunnerChat.cloneRepo', () => {
        vscode.commands.executeCommand('git.clone');
    });

    // MCP 관련 명령어 등록 (기본 구현)
    const listMcpCommand = vscode.commands.registerCommand('pythonRunnerChat.listMCPServers', async () => {
        try {
            const { getMcpClient } = await import('./mcpClient');
            const client = getMcpClient();
            const servers = client.getServers();
            
            if (servers.length === 0) {
                vscode.window.showInformationMessage('연결된 MCP 서버가 없습니다.');
            } else {
                const serverInfo = servers.map(s => `${s.config.name}: ${s.status}`).join('\n');
                vscode.window.showInformationMessage(`MCP 서버 목록:\n${serverInfo}`);
            }
        } catch (error) {
            logMessage(LogLevel.ERROR, 'MCP 서버 목록 조회 실패', getErrorTrace(error));
            vscode.window.showErrorMessage('MCP 서버 목록을 가져올 수 없습니다.');
        }
    });

    const refreshMcpCommand = vscode.commands.registerCommand('pythonRunnerChat.refreshMCPServers', async () => {
        try {
            const { getMcpClient } = await import('./mcpClient');
            const client = getMcpClient();
            await client.refreshAllServers();
            vscode.window.showInformationMessage('MCP 서버 새로고침 완료');
        } catch (error) {
            logMessage(LogLevel.ERROR, 'MCP 서버 새로고침 실패', getErrorTrace(error));
            vscode.window.showErrorMessage('MCP 서버 새로고침에 실패했습니다.');
        }
    });

    // 테스트 명령어들
    const testMcpConnectionCommand = vscode.commands.registerCommand('pythonRunnerChat.testMcpConnection', async () => {
        try {
            const { getMcpClient } = await import('./mcpClient');
            const client = getMcpClient();
            const debugInfo = client.getDebugInfo();
            
            vscode.window.showInformationMessage(`MCP 연결 테스트 완료: ${JSON.stringify(debugInfo)}`);
            logMessage(LogLevel.INFO, 'MCP 연결 테스트 실행');
        } catch (error) {
            logMessage(LogLevel.ERROR, 'MCP 연결 테스트 실패', getErrorTrace(error));
            vscode.window.showErrorMessage('MCP 연결 테스트에 실패했습니다.');
        }
    });

    // LM Studio 관련 명령어 등록
    const configureLMStudioCommand = vscode.commands.registerCommand('pythonRunnerChat.configureLMStudio', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'pythonRunnerChat.llm');
    });

    const testLMStudioCommand = vscode.commands.registerCommand('pythonRunnerChat.testLMStudio', async () => {
        try {
            const { LLMService } = await import('./llm/LLMService');
            const llmService = new LLMService();
            const isConnected = await llmService.testConnection();
            
            if (isConnected) {
                vscode.window.showInformationMessage('✅ LM Studio 연결 성공!');
            } else {
                vscode.window.showErrorMessage('❌ LM Studio 연결 실패. 서버가 실행 중인지 확인하세요.');
            }
        } catch (error) {
            logMessage(LogLevel.ERROR, 'LM Studio 연결 테스트 실패', getErrorTrace(error));
            vscode.window.showErrorMessage('LM Studio 연결 테스트에 실패했습니다.');
        }
    });

    // 웹뷰 제공자 등록
    const webviewRegistration = vscode.window.registerWebviewViewProvider(
        PythonRunnerWebviewProvider.viewType,
        provider
    );

    // 구독에 컨텍스트 추가
    context.subscriptions.push(
        openCommand,
        runSelectionCommand,
        openFileCommand,
        newFileCommand,
        openFolderCommand,
        cloneRepoCommand,
        listMcpCommand,
        refreshMcpCommand,
        testMcpConnectionCommand,
        configureLMStudioCommand,
        testLMStudioCommand,
        webviewRegistration
    );

    // 확장 비활성화 시 정리 작업 등록
    context.subscriptions.push({
        dispose: async () => {
            try {
                await disposeMcpClient();
                logMessage(LogLevel.INFO, 'MCP 시스템 정리 완료');
            } catch (error) {
                logMessage(LogLevel.ERROR, 'MCP 시스템 정리 실패', getErrorTrace(error));
            }
        }
    });
}

/**
 * 확장 비활성화 시 호출되는 함수
 */
export async function deactivate() {
    console.log('Python Runner Extension with MCP 비활성화됨');
    
    try {
        await disposeMcpClient();
        logMessage(LogLevel.INFO, 'MCP 시스템 정리 완료');
    } catch (error) {
        logMessage(LogLevel.ERROR, 'MCP 시스템 정리 실패', getErrorTrace(error));
    }
}

/**
 * 로그 메시지 출력
 */
function logMessage(level: LogLevel, message: string, trace?: string): void {
    const timestamp = new Date().toISOString();
    const logObject = {
        timestamp,
        level,
        message,
        trace
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

/**
 * 에러 스택 트레이스 추출
 */
function getErrorTrace(error: any): string {
    if (error instanceof Error) {
        return error.stack || error.message;
    }
    return String(error);
}
