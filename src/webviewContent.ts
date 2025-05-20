/**
 * 웹뷰 HTML 콘텐츠 생성 모듈
 * VSCode WebView에 표시될 HTML/CSS/JS 코드를 생성
 */

// HTML 템플릿 생성 함수
export function getWebviewContent(): string {
  return /*html*/`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${getVscodeWebviewResourceUri()} data:; style-src ${getVscodeWebviewResourceUri()} 'unsafe-inline'; script-src ${getVscodeWebviewResourceUri()} 'unsafe-inline';">
      <title>Python Runner Chat</title>
      <style>
        ${getStyleContent()}
      </style>
    </head>
    <body>
      <div id="app">
        <!-- 헤더 영역 -->
        <div id="header" accessibilityRole="banner" accessibilityLevel="1">
          <div class="header-title">
            <span class="title">Python Runner Chat</span>
          </div>
          <div class="header-buttons">
            <button id="settingsButton" class="tool-button" title="설정" accessibilityRole="button">⚙️</button>
            <button id="newFileButton" class="tool-button" title="새 파일" accessibilityRole="button">📄</button>
            <button id="openFileButton" class="tool-button" title="파일 열기" accessibilityRole="button">📂</button>
          </div>
        </div>

        <!-- 콘텐츠 영역 -->
        <div id="content-wrapper">
          <!-- 메인 컨테이너 -->
          <div id="main-container">
            <!-- 시작 페이지 -->
            <div id="start-page">
              <h2>시작하기</h2>
              <div class="start-buttons">
                <button id="newFileBtn" class="action-button" accessibilityRole="button">
                  <span class="button-icon">📄</span>
                  새 파일
                </button>
                <button id="openFileBtn" class="action-button" accessibilityRole="button">
                  <span class="button-icon">📂</span>
                  파일 열기
                </button>
                <button id="cloneRepoButton" class="action-button" accessibilityRole="button">
                  <span class="button-icon">📦</span>
                  레포지토리 복제
                </button>
                <button id="problemsButton" class="action-button" accessibilityRole="button">
                  <span class="button-icon">🔍</span>
                  문제 보기
                </button>
              </div>
            </div>

            <!-- 메시지 표시 영역 -->
            <div id="messages-container"></div>

            <!-- 변수 패널 -->
            <div id="variables-panel">
              <div class="panel-header">
                <span>변수 탐색기 패널</span>
              </div>
              <div class="panel-content">
                <div id="variable-list"></div>
              </div>
            </div>

            <!-- 히스토리 패널 -->
            <div id="history-panel">
              <div class="panel-header">
                <span>코드 히스토리</span>
              </div>
              <div class="panel-content">
                <div class="history-tabs">
                  <button id="sessionTabButton" class="tab-button active" title="세션">세션 히스토리</button>
                </div>
                <div id="history-content"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 입력 영역 - 항상 표시 -->
        <div id="input-container" accessibilityRole="textbox">
          <textarea 
            id="messageInput"
            placeholder="Python 코드를 입력하세요..."
            accessibilityRole="textbox"
            aria-label="Python 코드 입력"
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

// VSCode WebView 리소스 URI 획득
function getVscodeWebviewResourceUri(): string {
  return 'vscode-webview-resource:';
}

// CSS 스타일 내용
function getStyleContent(): string {
  return /*css*/`
    :root {
      --background-color: var(--vscode-editor-background);
      --text-color: var(--vscode-editor-foreground);
      --border-color: var(--vscode-panel-border);
      --input-background: var(--vscode-input-background);
      --button-background: var(--vscode-button-background);
      --button-foreground: var(--vscode-button-foreground);
      --button-hover-background: var(--vscode-button-hoverBackground);
      --active-tab: var(--vscode-tab-activeBackground);
      --inactive-tab: var(--vscode-tab-inactiveBackground);
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
    
    /* 앱 컨테이너 */
    #app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    
    /* 헤더 스타일 */
    #header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--background-color);
      z-index: 40;
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
    
    /* 콘텐츠 래퍼 */
    #content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    /* 메인 컨테이너 */
    #main-container {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
      min-height: 0; /* flex 컨테이너 내에서 오버플로우 방지 */
    }
    
    /* 메시지 컨테이너 */
    #messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    /* 메시지 스타일 */
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
      background-color: var(--inactive-tab);
      align-self: flex-start;
      border-radius: 12px 12px 12px 0;
    }
    
    .error-message {
      color: var(--error-color);
      background-color: rgba(255, 0, 0, 0.1);
      border-left: 3px solid var(--error-color);
    }
    
    /* 코드 블록 스타일 */
    .code-block {
      background-color: var(--input-background);
      padding: 10px;
      border-radius: 4px;
      font-family: 'Consolas', 'Courier New', monospace;
      overflow-x: auto;
      margin: 8px 0;
    }
    
    /* 입력 컨테이너 - 항상 하단에 표시 */
    #input-container {
      padding: 12px;
      background-color: var(--background-color);
      border-top: 1px solid var(--border-color);
      display: flex !important; /* 항상 표시 */
      flex-direction: column;
      z-index: 50; /* 최상위 표시 */
    }
    
    /* 입력 텍스트 영역 */
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
    
    /* 버튼 컨테이너 */
    #button-container {
      display: flex !important; /* 항상 표시 */
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      z-index: 60; /* 최상위 표시 */
    }
    
    /* 액션 버튼 컨테이너 */
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    
    /* 액션 버튼 스타일 */
    .action-btn {
      background-color: var(--button-background);
      color: var(--button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      min-width: 80px; /* 최소 너비 보장 */
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    /* 주요 버튼 강조 */
    .primary-btn {
      background-color: #0078d4; /* 더 눈에 띄는 파란색 */
      font-size: 110%;
      font-weight: bold;
    }
    
    .action-btn:hover {
      background-color: var(--button-hover-background);
    }
    
    /* 상태 표시기 */
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
    
    /* 시작 페이지 스타일 */
    #start-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      background-color: var(--background-color);
      position: absolute;
      top: 0;
      left: 0;
      z-index: 10;
    }
    
    #start-page h2 {
      margin-bottom: 24px;
    }
    
    .start-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 250px;
    }
    
    .action-button {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: var(--button-background);
      color: var(--button-foreground);
      border: none;
      padding: 12px 16px;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    }
    
    .action-button:hover {
      background-color: var(--button-hover-background);
    }
    
    .button-icon {
      font-size: 18px;
    }
    
    /* 패널 공통 스타일 */
    #variables-panel, #history-panel {
      display: none;
      width: 300px;
      border-left: 1px solid var(--border-color);
      flex-direction: column;
    }
    
    .panel-header {
      padding: 8px 12px;
      font-weight: bold;
      border-bottom: 1px solid var(--border-color);
    }
    
    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    /* 변수 아이템 스타일 */
    .variable-item, .history-item {
      padding: 6px 8px;
      cursor: pointer;
      border-radius: 4px;
    }
    
    .variable-item:hover, .history-item:hover {
      background-color: var(--input-background);
    }
    
    .variable-name {
      font-weight: bold;
    }
    
    .variable-type {
      color: var(--text-color);
      opacity: 0.7;
      font-size: 12px;
      margin-left: 8px;
    }
    
    .variable-value {
      word-break: break-all;
    }
    
    /* 확장 아이콘 스타일 */
    .expand-icon {
      margin-right: 6px;
      display: inline-block;
      transform: rotate(0deg);
      transition: transform 0.2s;
    }
    
    .expanded .expand-icon {
      transform: rotate(90deg);
    }
    
    .child-variables {
      margin-left: 20px;
      display: none;
    }
    
    .expanded .child-variables {
      display: block;
    }
    
    /* 히스토리 탭 스타일 */
    .history-tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 10px;
    }
    
    .tab-button {
      padding: 8px 16px;
      background: var(--inactive-tab);
      border: none;
      cursor: pointer;
    }
    
    .tab-button.active {
      background-color: var(--active-tab);
      border-bottom: 2px solid var(--button-background);
    }
    
    /* 시간 표시 스타일 */
    .timestamp {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    /* 출력 스타일 */
    .image-output {
      max-width: 100%;
      margin: 10px 0;
    }
    
    .output-container {
      margin-top: 8px;
      border-left: 3px solid var(--button-background);
      padding-left: 10px;
    }
    
    .error-container {
      margin-top: 8px;
      border-left: 3px solid var(--error-color);
      padding-left: 10px;
      color: var(--error-color);
    }
    
    .error-analysis {
      margin-top: 8px;
      padding: 10px;
      background-color: rgba(255, 0, 0, 0.05);
      border-radius: 4px;
    }
  `;
}

// 자바스크립트 내용
function getScriptContent(): string {
  return /*javascript*/`
    (function() {
      // 상태 변수들
      let currentView = 'messages'; // 'messages', 'variables', 'history'
      let activeHistoryTab = 'sessions'; // 'sessions', 'bookmarks'
      let isProcessing = false;
      let variables = [];
      let sessionHistory = [];
      let bookmarks = [];
      
      // DOM 요소 캐싱
      const messageInput = document.getElementById('messageInput');
      const messagesContainer = document.getElementById('messages-container');
      const variablesPanel = document.getElementById('variables-panel');
      const historyPanel = document.getElementById('history-panel');
      const statusIndicator = document.getElementById('status-indicator');
      const startPage = document.getElementById('start-page');
      
      // 버튼 요소 캐싱
      const sendButton = document.getElementById('sendButton');
      const runCodeButton = document.getElementById('runCodeButton');
      const settingsButton = document.getElementById('settingsButton');
      const toggleViewButton = document.getElementById('toggleViewButton');
      const variablesButton = document.getElementById('variablesButton');
      const historyButton = document.getElementById('historyButton');
      const historyTabs = document.querySelectorAll('.history-tabs .tab-button');
      const createSessionButton = document.getElementById('createSessionButton');
      const clearButton = document.getElementById('clearButton');
      const newFileButton = document.getElementById('newFileButton');
      const openFileButton = document.getElementById('openFileButton');
      const openFolderButton = document.getElementById('openFolderButton');
      const cloneRepoButton = document.getElementById('cloneRepoButton');
      const problemsButton = document.getElementById('problemsButton');
      const outputButton = document.getElementById('outputButton');
      const debugButton = document.getElementById('debugButton');
      const terminalButton = document.getElementById('terminalButton');
      
      // 시작 페이지 버튼
      const newFileBtn = document.getElementById('newFileBtn');
      const openFileBtn = document.getElementById('openFileBtn');
      
      // VSCode와의 통신을 위한 vscode API
      const vscode = acquireVsCodeApi();
      
      // 초기화 함수
      function initialize() {
        setupEventListeners();
        debugButtonVisibility(); // 버튼 표시 여부 디버깅
        hideStartPage(); // 시작 페이지 숨기기 (대화 모드로 바로 전환)
      }

      // 버튼 표시 여부 디버깅
      function debugButtonVisibility() {
        // 전송 버튼이 보이는지 확인 메시지
        console.log('SendButton exists:', !!document.getElementById('sendButton'));
        console.log('RunCodeButton exists:', !!document.getElementById('runCodeButton'));
        
        if(sendButton) {
          console.log('SendButton visible:', sendButton.offsetWidth > 0 && sendButton.offsetHeight > 0);
          console.log('SendButton style:', sendButton.style.cssText);
          console.log('SendButton computed style:', window.getComputedStyle(sendButton).display);
          console.log('SendButton position:', window.getComputedStyle(sendButton).position);
        }
        
        if(runCodeButton) {
          console.log('RunCodeButton visible:', runCodeButton.offsetWidth > 0 && runCodeButton.offsetHeight > 0);
          console.log('RunCodeButton style:', runCodeButton.style.cssText);
          console.log('RunCodeButton computed style:', window.getComputedStyle(runCodeButton).display);
        }
        
        // 버튼 컨테이너 확인
        const btnContainer = document.getElementById('button-container');
        if(btnContainer) {
          console.log('ButtonContainer style:', btnContainer.style.cssText);
          console.log('ButtonContainer computed style:', window.getComputedStyle(btnContainer).display);
          console.log('ButtonContainer visible:', btnContainer.offsetWidth > 0 && btnContainer.offsetHeight > 0);
        }
      }
      
      // 시작 페이지 표시
      function showStartPage() {
        startPage.style.display = 'flex';
        messagesContainer.style.display = 'none';
      }
      
      // 시작 페이지 숨기기
      function hideStartPage() {
        startPage.style.display = 'none';
        messagesContainer.style.display = 'flex';
        debugButtonVisibility(); // 버튼 표시 여부 재확인
      }
      
      // 메시지 추가 함수
      function appendMessage(text, type = 'user') {
        const timestamp = new Date().toLocaleTimeString();
        const message = document.createElement('div');
        message.className = \`message \${type}-message\`;
        
        // 코드 블록 포맷팅
        let formattedText = text;
        formattedText = formatCodeBlocks(formattedText);
        
        message.innerHTML = formattedText;
        message.innerHTML += \`<div class="timestamp">\${timestamp}</div>\`;
        
        messagesContainer.appendChild(message);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      // 코드 블록 포맷팅 함수
      function formatCodeBlocks(text) {
        const codeBlockRegex = /\`\`\`(\\w*)\\n([\\s\\S]*?)\\n\`\`\`/g;
        const inlineCodeRegex = /\`([^\\n]*?)\`/g;
        
        // 코드 블록 처리
        text = text.replace(codeBlockRegex, (match, language, code) => {
          return \`<div class="code-block"><div class="code-language">\${language || 'text'}</div><pre>\${escapeHtml(code)}</pre></div>\`;
        });
        
        // 인라인 코드 처리
        text = text.replace(inlineCodeRegex, (match, code) => {
          return \`<code>\${escapeHtml(code)}</code>\`;
        });
        
        return text;
      }
      
      // HTML 이스케이프 함수
      function escapeHtml(unsafe) {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      
      // 변수 패널 업데이트
      function updateVariablesPanel(variables) {
        const variableList = document.getElementById('variable-list');
        variableList.innerHTML = '';
        
        variables.forEach(variable => {
          const variableItem = createVariableItem(variable);
          variableList.appendChild(variableItem);
        });
        
        if (variables.length === 0) {
          variableList.innerHTML = '<div class="empty-message">No variables available</div>';
        }
      }
      
      // 변수 아이템 생성
      function createVariableItem(variable) {
        const item = document.createElement('div');
        item.className = 'variable-item';
        
        const hasChildren = variable.expandable || (variable.children && variable.children.length > 0);
        
        let html = '';
        if (hasChildren) {
          html += '<span class="expand-icon">▶</span>';
        } else {
          html += '<span class="expand-icon-placeholder"></span>';
        }
        
        html += \`<span class="variable-name">\${variable.name}</span>\`;
        html += \`<span class="variable-type">\${variable.type}</span>\`;
        html += \`<div class="variable-value">\${typeof variable.value === 'object' ? JSON.stringify(variable.value, null, 2) : variable.value}</div>\`;
        
        if (hasChildren) {
          html += '<div class="child-variables"></div>';
        }
        
        item.innerHTML = html;
        
        if (hasChildren) {
          item.querySelector('.expand-icon').addEventListener('click', function() {
            toggleVariableExpand(item, variable.name);
          });
        }
        
        return item;
      }
      
      // 변수 확장/축소 토글
      function toggleVariableExpand(element, variableName) {
        element.classList.toggle('expanded');
        
        const childContainer = element.querySelector('.child-variables');
        
        if (element.classList.contains('expanded') && !childContainer.hasChildNodes()) {
          // 확장 아이콘 업데이트
          const expandIcon = element.querySelector('.expand-icon');
          expandIcon.textContent = '▼';
          
          // 자식 변수 데이터 요청
          vscode.postMessage({
            command: 'getVariableChildren',
            variableName: variableName
          });
        } else {
          // 확장 아이콘 업데이트
          const expandIcon = element.querySelector('.expand-icon');
          expandIcon.textContent = '▶';
        }
      }
      
      // 변수 자식 데이터 처리
      function handleVariableChildrenData(variableName, data) {
        const variableItems = document.querySelectorAll('.variable-item');
        
        for (const item of variableItems) {
          if (item.querySelector('.variable-name').textContent === variableName) {
            const childContainer = item.querySelector('.child-variables');
            
            data.forEach(childVar => {
              const childItem = createVariableItem(childVar);
              childContainer.appendChild(childItem);
            });
            
            break;
          }
        }
      }
      
      // 히스토리 패널 업데이트
      function updateHistoryPanel(sessions) {
        const historyContent = document.getElementById('history-content');
        historyContent.innerHTML = '';
        
        sessions.forEach(session => {
          const sessionItem = document.createElement('div');
          sessionItem.className = 'history-session';
          
          sessionItem.innerHTML = \`
            <div class="session-header">
              <span class="session-name">\${session.name}</span>
              <span class="timestamp">\${new Date(session.timestamp).toLocaleString()}</span>
            </div>
            <div class="session-items"></div>
          \`;
          
          const sessionItems = sessionItem.querySelector('.session-items');
          
          session.codeItems.forEach(item => {
            const codeItem = document.createElement('div');
            codeItem.className = 'history-item';
            codeItem.innerHTML = \`
              <div class="code-preview">\${item.code.substring(0, 50)}...</div>
              <div class="timestamp">\${new Date(item.timestamp).toLocaleString()}</div>
            \`;
            
            codeItem.addEventListener('click', () => {
              loadCodeFromHistory(item.code);
            });
            
            sessionItems.appendChild(codeItem);
          });
          
          historyContent.appendChild(sessionItem);
        });
        
        if (sessions.length === 0) {
          historyContent.innerHTML = '<div class="empty-message">No session history available</div>';
        }
      }
      
      // 북마크 패널 업데이트
      function updateBookmarksPanel(bookmarks) {
        const historyContent = document.getElementById('history-content');
        historyContent.innerHTML = '';
        
        bookmarks.forEach(bookmark => {
          const bookmarkItem = document.createElement('div');
          bookmarkItem.className = 'history-item';
          
          bookmarkItem.innerHTML = \`
            <div class="bookmark-header">
              <span class="bookmark-name">\${bookmark.name}</span>
              <span class="timestamp">\${new Date(bookmark.timestamp).toLocaleString()}</span>
            </div>
            <div class="code-preview">\${bookmark.code.substring(0, 50)}...</div>
          \`;
          
          bookmarkItem.addEventListener('click', () => {
            loadCodeFromHistory(bookmark.code);
          });
          
          historyContent.appendChild(bookmarkItem);
        });
        
        if (bookmarks.length === 0) {
          historyContent.innerHTML = '<div class="empty-message">No bookmarks available</div>';
        }
      }
      
      // 히스토리에서 코드 로드
      function loadCodeFromHistory(code) {
        messageInput.value = code;
      }
      
      // 패널 전환
      function switchView(view) {
        debugLog('Switching view to: ' + view);
        currentView = view;
        
        startPage.style.display = 'none';
        messagesContainer.style.display = 'none';
        variablesPanel.style.display = 'none';
        historyPanel.style.display = 'none';
        
        if (view === 'messages') {
          debugLog('Showing messages view');
          messagesContainer.style.display = 'flex';
          if (toggleViewButton) toggleViewButton.textContent = 'Panel';
          
        } else if (view === 'variables') {
          debugLog('Showing variables view');
          variablesPanel.style.display = 'flex';
          
          vscode.postMessage({
            command: 'getVariables'
          });
          
        } else if (view === 'history') {
          debugLog('Showing history view');
          historyPanel.style.display = 'flex';
          
          if (activeHistoryTab === 'sessions') {
            vscode.postMessage({
              command: 'getSessionHistory'
            });
          } else {
            vscode.postMessage({
              command: 'getBookmarks'
            });
          }
        } else if (view === 'start') {
          debugLog('Showing start page');
          startPage.style.display = 'flex';
          if (toggleViewButton) toggleViewButton.textContent = 'Code';
        }
        
        // 뷰 전환 후 버튼 가시성 확인
        debugButtonVisibility();
        
        vscode.postMessage({
          command: 'viewChanged',
          view: view
        });
      }
      
      // 코드 실행 함수
      function runCode() {
        const code = messageInput.value.trim();
        
        if (code === '') {
          return;
        }
        
        appendMessage(code, 'user');
        
        // 처리 중 상태로 설정
        isProcessing = true;
        if (sendButton) sendButton.disabled = true;
        if (runCodeButton) runCodeButton.disabled = true;
        
        vscode.postMessage({
          command: 'runCode',
          code: code
        });
        
        // 입력창 초기화
        messageInput.value = '';
      }
      
      // 메시지 전송 함수
      function sendMessage() {
        const text = messageInput.value.trim();
        
        if (text === '') {
          return;
        }
        
        appendMessage(text, 'user');
        
        // 처리 중 상태로 설정
        isProcessing = true;
        if (sendButton) sendButton.disabled = true;
        if (runCodeButton) runCodeButton.disabled = true;
        
        vscode.postMessage({
          command: 'sendMessage',
          text: text
        });
        
        // 입력창 초기화
        messageInput.value = '';
      }
      
      // 이벤트 리스너 설정
      function setupEventListeners() {
        // 메시지 수신 이벤트
        window.addEventListener('message', event => {
          const message = event.data;
          debugLog('Received message: ' + JSON.stringify(message));
          
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
              
            case 'variables':
              variables = message.data;
              updateVariablesPanel(variables);
              break;
              
            case 'variableChildren':
              handleVariableChildrenData(message.variableName, message.data);
              break;
              
            case 'sessionHistory':
              sessionHistory = message.data;
              updateHistoryPanel(sessionHistory);
              break;
              
            case 'bookmarks':
              bookmarks = message.data;
              updateBookmarksPanel(bookmarks);
              break;
              
            case 'updateIndicator':
              statusIndicator.textContent = message.text;
              statusIndicator.className = message.type;
              break;
              
            case 'errorOutput':
              appendMessage(message.error, 'error');
              isProcessing = false;
              if (sendButton) sendButton.disabled = false;
              if (runCodeButton) runCodeButton.disabled = false;
              break;
              
            case 'showStatus':
              if (message.type === 'error') {
                statusIndicator.className = 'error';
              } else {
                statusIndicator.className = '';
              }
              statusIndicator.textContent = message.text;
              break;
              
            case 'systemMessage':
              appendMessage(message.text, 'system');
              isProcessing = false;
              if (sendButton) sendButton.disabled = false;
              if (runCodeButton) runCodeButton.disabled = false;
              break;
              
            default:
              debugLog('Unknown message: ' + JSON.stringify(message));
              break;
          }
        });
        
        // 입력 이벤트 처리
        messageInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            runCode();
          } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      
        // 버튼 이벤트 처리
        if (sendButton) {
          sendButton.addEventListener('click', () => {
            debugLog('Send button clicked');
            sendMessage();
          });
        } else {
          console.error('SendButton element not found!');
        }
        
        if (runCodeButton) {
          runCodeButton.addEventListener('click', () => {
            debugLog('Run code button clicked');
            runCode();
          });
        } else {
          console.error('RunCodeButton element not found!');
        }
        
        if (settingsButton) {
          settingsButton.addEventListener('click', () => {
            debugLog('Settings button clicked');
            vscode.postMessage({
              command: 'openSettings'
            });
          });
        }
        
        if (newFileButton) {
          newFileButton.addEventListener('click', () => {
            debugLog('New file button clicked');
            vscode.postMessage({
              command: 'newFile'
            });
          });
        }
        
        if (openFileButton) {
          openFileButton.addEventListener('click', () => {
            debugLog('Open file button clicked');
            vscode.postMessage({
              command: 'openFile'
            });
          });
        }
        
        // 시작 페이지 버튼들
        if (newFileBtn) {
          newFileBtn.addEventListener('click', () => {
            debugLog('New file button clicked');
            vscode.postMessage({
              command: 'newFile'
            });
          });
        }
        
        if (openFileBtn) {
          openFileBtn.addEventListener('click', () => {
            debugLog('Open file button clicked');
            vscode.postMessage({
              command: 'openFile'
            });
          });
        }
        
        if (openFolderButton) {
          openFolderButton.addEventListener('click', () => {
            debugLog('Open folder button clicked');
            vscode.postMessage({
              command: 'openFolder'
            });
          });
        }
        
        if (cloneRepoButton) {
          cloneRepoButton.addEventListener('click', () => {
            debugLog('Clone repo button clicked');
            vscode.postMessage({
              command: 'cloneRepo'
            });
          });
        }
        
        if (problemsButton) {
          problemsButton.addEventListener('click', () => {
            debugLog('Problems button clicked');
            vscode.postMessage({
              command: 'showProblems'
            });
          });
        }
        
        if (outputButton) {
          outputButton.addEventListener('click', () => {
            debugLog('Output button clicked');
            vscode.postMessage({
              command: 'showOutput'
            });
          });
        }
        
        if (debugButton) {
          debugButton.addEventListener('click', () => {
            debugLog('Debug button clicked');
            vscode.postMessage({
              command: 'startDebug'
            });
          });
        }
        
        if (terminalButton) {
          terminalButton.addEventListener('click', () => {
            debugLog('Terminal button clicked');
            vscode.postMessage({
              command: 'showTerminal'
            });
          });
        }
      }
      
      // 디버그 로그 함수
      function debugLog(message) {
        console.log('[DEBUG] ' + message);
      }
      
      // 초기화 실행
      initialize();
    })();
  `;
}
