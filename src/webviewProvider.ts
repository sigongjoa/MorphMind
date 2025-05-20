/**
 * WebView 제공자 모듈
 * VSCode WebView 관리 및 생성을 담당
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from './webviewContent';
import { MessageHandler } from './messageHandler';

export class PythonRunnerWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'vscode-python-runner.chatView';
  
  private _view?: vscode.WebviewPanel;
  private _extensionUri: vscode.Uri;
  private _extensionPath: string;
  private _messageHandler?: MessageHandler;
  private _pythonPath: string;
  
  constructor(extensionUri: vscode.Uri, extensionPath: string) {
    this._extensionUri = extensionUri;
    this._extensionPath = extensionPath;
    this._pythonPath = this.getPythonPath();
  }
  
  /**
   * WebView 패널 생성
   */
  public createWebviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    // 이미 생성된 패널이 있다면 보여주기
    if (this._view) {
      this._view.reveal(vscode.ViewColumn.Beside);
      return this._view;
    }
    
    // WebView 옵션 설정
    const options: vscode.WebviewOptions & vscode.WebviewPanelOptions = {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionPath, 'media')),
        vscode.Uri.file(path.join(this._extensionPath, 'node_modules'))
      ]
    };
    
    // WebView 패널 생성
    this._view = vscode.window.createWebviewPanel(
      PythonRunnerWebviewProvider.viewType,
      'Python Runner',
      vscode.ViewColumn.Beside,
      options
    );
    
    // WebView 내용 설정
    this._view.webview.html = getWebviewContent();
    
    // 메시지 핸들러 생성
    this._messageHandler = new MessageHandler(this._view, this._extensionPath, this._pythonPath);
    
    // 패널 닫힘 이벤트 처리
    this._view.onDidDispose(() => {
      this._view = undefined;
      this._messageHandler = undefined;
    }, null, context.subscriptions);
    
    return this._view;
  }
  
  /**
   * WebView 해결 (필수 구현, WebviewViewProvider 인터페이스)
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionPath, 'media')),
        vscode.Uri.file(path.join(this._extensionPath, 'node_modules'))
      ]
    };
    
    webviewView.webview.html = getWebviewContent();
    
    // 메시지 핸들러 생성
    this._messageHandler = new MessageHandler(
      { webview: webviewView.webview } as vscode.WebviewPanel,
      this._extensionPath,
      this._pythonPath
    );
  }
  
  /**
   * 시스템 파이썬 경로 가져오기
   */
  private getPythonPath(): string {
    // VSCode Python 확장의 설정에서 파이썬 경로 가져오기
    const pythonConfig = vscode.workspace.getConfiguration('python');
    const pythonPath = pythonConfig.get<string>('defaultInterpreterPath') || 'python';
    return pythonPath;
  }
  
  /**
   * 메시지 전송
   */
  public sendMessage(message: any): void {
    if (this._messageHandler) {
      this._messageHandler.sendMessage(message);
    }
  }
}
