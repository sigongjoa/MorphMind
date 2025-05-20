/**
 * 디버그 테스트 스크립트
 * 
 * VS Code 확장에서 웹뷰 통신 문제를 해결하기 위한 테스트 코드입니다.
 * 이 코드는 extension.ts에 포함되지 않고 독립적으로 실행됩니다.
 */

// 특정 DOM 요소 상태 확인 테스트
function testDomElements() {
  console.log('DOM 요소 테스트 시작');
  
  const buttons = [
    'toggleViewButton', 
    'historyButton', 
    'variablesButton', 
    'settingsButton', 
    'clearButton',
    'sendButton',
    'runCodeButton'
  ];
  
  buttons.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${id}: ${element ? '존재' : '없음'}`);
    
    if (element) {
      // 이벤트 리스너 테스트
      const clone = element.cloneNode(true);
      element.parentNode.replaceChild(clone, element);
      console.log(`${id} 리스너 재설정 필요`);
    }
  });
  
  console.log('DOM 요소 테스트 완료');
}

// VS Code API 테스트
function testVsCodeApi() {
  try {
    const vscode = acquireVsCodeApi();
    console.log('VS Code API 가져오기 성공');
    
    // 테스트 메시지 보내기
    vscode.postMessage({
      type: 'debug',
      action: 'test_api',
      timestamp: new Date().toISOString()
    });
    
    console.log('테스트 메시지 전송 성공');
    return true;
  } catch (e) {
    console.error('VS Code API 테스트 실패:', e);
    return false;
  }
}

// 테스트 실행
console.log('디버그 테스트 시작');
testDomElements();
const apiResult = testVsCodeApi();
console.log('VS Code API 테스트 결과:', apiResult ? '성공' : '실패');
console.log('디버그 테스트 완료');
