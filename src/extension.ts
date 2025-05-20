/**
 * Python Runner Extension
 * VSCode에서 Python 코드를 대화식으로 실행하고 결과를 확인할 수 있는 확장
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { PythonRunnerWebviewProvider } from './webviewProvider';
import { LogLevel } from './types';

/**
 * 확장 활성화 시 호출되는 함수
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Python Runner Extension 활성화됨');

  // WebView 제공자 생성
  const provider = new PythonRunnerWebviewProvider(
    context.extensionUri,
    context.extensionPath
  );

  // 명령 등록: Python Runner 열기
  const openCommand = vscode.commands.registerCommand('extension.openChat', () => {
    // WebView 패널 생성
    const panel = provider.createWebviewPanel(context);
    
    // 시스템 메시지 전송
    provider.sendMessage({
      command: 'systemMessage',
      text: 'Python Runner가 시작되었습니다. 코드를 입력하고 실행해보세요.'
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
    
    // 로그 출력
    logMessage(LogLevel.INFO, '선택된 코드 실행');
  });

  // 추가 명령 등록: 파일 열기
  const openFileCommand = vscode.commands.registerCommand('pythonRunnerChat.openFile', () => {
    vscode.commands.executeCommand('workbench.action.files.openFile');
  });

  // 추가 명령 등록: 새 파일 생성
  const newFileCommand = vscode.commands.registerCommand('pythonRunnerChat.newFile', () => {
    vscode.commands.executeCommand('workbench.action.files.newUntitledFile');
  });

  // 추가 명령 등록: 폴더 열기
  const openFolderCommand = vscode.commands.registerCommand('pythonRunnerChat.openFolder', () => {
    vscode.commands.executeCommand('workbench.action.files.openFolder');
  });

  // 추가 명령 등록: Git 저장소 복제
  const cloneRepoCommand = vscode.commands.registerCommand('pythonRunnerChat.cloneRepo', () => {
    vscode.commands.executeCommand('git.clone');
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
    webviewRegistration
  );
}

/**
 * 확장 비활성화 시 호출되는 함수
 */
export function deactivate(): void {
  console.log('Python Runner Extension 비활성화됨');
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
