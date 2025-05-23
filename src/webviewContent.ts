/**
 * 웹뷰 HTML 콘텐츠 생성 모듈
 * VSCode WebView에 표시될 HTML/CSS/JS 코드를 생성
 */

// HTML 템플릿 생성 함수
function getWebviewContent(): string {
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-webview-resource: data:; style-src vscode-webview-resource: 'unsafe-inline'; script-src vscode-webview-resource: 'unsafe-inline';">
      <title>Python Runner Chat</title>
      <style>
        ${getStyleContent()}
      </style>
    </head>
    <body>
      <div id="app">
        <!-- 헤더 영역 -->
        <div id="header">
          <div class="header-title">
            <span class="title">Python Runner Chat</span>
          </div>
          <div class="header-buttons">
            <button id="testLMStudioButton" class="tool-button" title="LM Studio 연결 테스트">🔗</button>
            <button id="resetConversationButton" class="tool-button" title="대화 초기화">🔄</button>
            <button id="settingsButton" class="tool-button" title="설정">⚙️</button>
            <button id="newFileButton" class="tool-button" title="새 파일">📄</button>
            <button id="openFileButton" class="tool-button" title="파일 열기">📂</button>
          </div>
        </div>

        <!-- 콘텐츠 영역 -->
        <div id="content-wrapper">
          <!-- 메인 컨테이너 -->
          <div id="main-container">
            <!-- 메시지 표시 영역 -->
            <div id="messages-container"></div>
          </div>
        </div>

        <!-- 입력 영역 - 항상 표시 -->
        <div id="input-container">
          <textarea 
            id="messageInput"
            placeholder="Python 코드를 입력하세요..."
          ></textarea>
          <div id="button-container">
            <div id="status-indicator">준비 완료</div>
            <div class="action-buttons">
              <button id="runCodeButton" class="action-btn" title="코드 실행 (Ctrl+Enter)">▶️ 실행</button>
              <button id="sendButton" class="action-btn primary-btn" title="메시지 전송 (Shift+Enter)">➤ 전송</button>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        ${getScriptContent()}
      </script>
    </body>
    </html>
  `;
}

// CSS 스타일 내용
function getStyleContent(): string {
    return /*css*/ `
    :root {
      --background-color: var(--vscode-editor-background);
      --text-color: var(--vscode-editor-foreground);
      --border-color: var(--vscode-panel-border);
      --input-background: var(--vscode-input-background);
      --button-background: var(--vscode-button-background);
      --button-foreground: var(--vscode-button-foreground);
      --button-hover-background: var(--vscode-button-hoverBackground);
      --error-color: var(--vscode-errorForeground);
      --success-color: var(--vscode-gitDecoration-addedResourceForeground);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body, html {
      font-family: var(--vscode-font-family);
      background-color: var(--background-color);
      color: var(--text-color);
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    
    #app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    
    #header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--background-color);
    }
    
    .header-title {
      font-weight: bold;
      font-size: 14px;
    }
    
    .header-buttons {
      display: flex;
      gap: 8px;
    }
    
    .tool-button {
      background: var(--button-background);
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      color: var(--button-foreground);
    }
    
    .tool-button:hover {
      background: var(--button-hover-background);
    }
    
    #content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    #main-container {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
      min-height: 0;
    }
    
    #messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .message {
      padding: 10px;
      border-radius: 4px;
      max-width: 100%;
      white-space: pre-wrap;
    }
    
    .user-message {
      background-color: var(--input-background);
      align-self: flex-end;
      border-radius: 12px 12px 0 12px;
    }
    
    .system-message {
      background-color: var(--button-background);
      align-self: flex-start;
      border-radius: 12px 12px 12px 0;
    }
    
    .error-message {
      color: var(--error-color);
      background-color: rgba(255, 0, 0, 0.1);
      border-left: 3px solid var(--error-color);
    }
    
    .code-block {
      background-color: var(--input-background);
      padding: 10px;
      border-radius: 4px;
      font-family: 'Consolas', 'Courier New', monospace;
      overflow-x: auto;
      margin: 8px 0;
    }
    
    #input-container {
      padding: 12px;
      background-color: var(--background-color);
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }
    
    #messageInput {
      width: 100%;
      min-height: 100px;
      resize: vertical;
      background-color: var(--input-background);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 8px;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    
    #button-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    
    .action-btn {
      background-color: var(--button-background);
      color: var(--button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      min-width: 80px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .primary-btn {
      background-color: #0078d4;
      font-size: 110%;
      font-weight: bold;
    }
    
    .action-btn:hover {
      background-color: var(--button-hover-background);
    }
    
    #status-indicator {
      font-size: 12px;
      color: var(--text-color);
    }
    
    .success {
      color: var(--success-color);
    }
    
    .error {
      color: var(--error-color);
    }
  `;
}

// 자바스크립트 내용
function getScriptContent(): string {
    return /*javascript*/ `
    (function() {
      let isProcessing = false;
      
      const messageInput = document.getElementById('messageInput');
      const messagesContainer = document.getElementById('messages-container');
      const statusIndicator = document.getElementById('status-indicator');
      const sendButton = document.getElementById('sendButton');
      const runCodeButton = document.getElementById('runCodeButton');
      const settingsButton = document.getElementById('settingsButton');
      const newFileButton = document.getElementById('newFileButton');
      const openFileButton = document.getElementById('openFileButton');
      const testLMStudioButton = document.getElementById('testLMStudioButton');
      const resetConversationButton = document.getElementById('resetConversationButton');
      
      const vscode = acquireVsCodeApi();
      
      function initialize() {
        setupEventListeners();
        console.log('Python Runner Chat initialized');
      }

      function appendMessage(text, type = 'user') {
        const timestamp = new Date().toLocaleTimeString();
        const message = document.createElement('div');
        message.className = \`message \${type}-message\`;
        
        let formattedText = formatCodeBlocks(text);
        
        message.innerHTML = formattedText;
        message.innerHTML += \`<div class="timestamp">\${timestamp}</div>\`;
        
        messagesContainer.appendChild(message);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      function formatCodeBlocks(text) {
        const codeBlockRegex = /\`\`\`(\\w*)\\n([\\s\\S]*?)\\n\`\`\`/g;
        const inlineCodeRegex = /\`([^\\n]*?)\`/g;
        
        text = text.replace(codeBlockRegex, (match, language, code) => {
          return \`<div class="code-block"><div class="code-language">\${language || 'text'}</div><pre>\${escapeHtml(code)}</pre></div>\`;
        });
        
        text = text.replace(inlineCodeRegex, (match, code) => {
          return \`<code>\${escapeHtml(code)}</code>\`;
        });
        
        return text;
      }
      
      function escapeHtml(unsafe) {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      
      function runCode() {
        const code = messageInput.value.trim();
        
        if (code === '') {
          return;
        }
        
        appendMessage(code, 'user');
        
        isProcessing = true;
        if (sendButton) sendButton.disabled = true;
        if (runCodeButton) runCodeButton.disabled = true;
        
        vscode.postMessage({
          command: 'runCode',
          code: code
        });
        
        messageInput.value = '';
      }
      
      function sendMessage() {
        const text = messageInput.value.trim();
        
        if (text === '') {
          return;
        }
        
        appendMessage(text, 'user');
        
        isProcessing = true;
        if (sendButton) sendButton.disabled = true;
        if (runCodeButton) runCodeButton.disabled = true;
        
        vscode.postMessage({
          command: 'sendMessage',
          text: text
        });
        
        messageInput.value = '';
      }
      
      function setupEventListeners() {
        window.addEventListener('message', event => {
          const message = event.data;
          
          switch (message.command) {
            case 'codeOutput':
              appendMessage(message.output, 'system');
              isProcessing = false;
              if (sendButton) sendButton.disabled = false;
              if (runCodeButton) runCodeButton.disabled = false;
              break;
              
            case 'updateStatus':
              isProcessing = message.isProcessing;
              if (sendButton) sendButton.disabled = message.isProcessing;
              if (runCodeButton) runCodeButton.disabled = message.isProcessing;
              statusIndicator.textContent = message.status;
              break;
              
            case 'errorOutput':
              appendMessage(message.error, 'error');
              isProcessing = false;
              if (sendButton) sendButton.disabled = false;
              if (runCodeButton) runCodeButton.disabled = false;
              break;
              
            case 'systemMessage':
              appendMessage(message.text, 'system');
              isProcessing = false;
              if (sendButton) sendButton.disabled = false;
              if (runCodeButton) runCodeButton.disabled = false;
              break;
          }
        });
        
        messageInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            runCode();
          } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      
        if (sendButton) {
          sendButton.addEventListener('click', () => {
            sendMessage();
          });
        }
        
        if (runCodeButton) {
          runCodeButton.addEventListener('click', () => {
            runCode();
          });
        }
        
        if (settingsButton) {
          settingsButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'openSettings'
            });
          });
        }
        
        if (newFileButton) {
          newFileButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'newFile'
            });
          });
        }
        
        if (openFileButton) {
          openFileButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'openFile'
            });
          });
        }
        
        if (testLMStudioButton) {
          testLMStudioButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'testLMStudio'
            });
          });
        }
        
        if (resetConversationButton) {
          resetConversationButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'resetConversation'
            });
          });
        }
      }
      
      initialize();
    })();
  `;
}

export { getWebviewContent };
