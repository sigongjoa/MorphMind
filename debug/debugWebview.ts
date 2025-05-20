import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { llm, logError } from "../src/llm";
import { PythonRunner } from "../src/modules/pythonRunner";
import { ErrorAnalyzer } from "../src/modules/errorAnalyzer";

// 확장 활성화 함수
export function activate(context: vscode.ExtensionContext) {
  console.log("디버그 웹뷰 확장이 활성화되었습니다.");

  // 모듈 인스턴스 생성
  const pythonRunner = new PythonRunner(context.globalStorageUri.fsPath);
  const errorAnalyzer = new ErrorAnalyzer();

  // 명령 등록
  let disposable = vscode.commands.registerCommand("extension.openDebugWebview", () => {
    // 웹뷰 패널 생성
    const panel = vscode.window.createWebviewPanel(
      "debugWebview",
      "Python Runner Debug",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // HTML 파일 로드
    const htmlPath = path.join(context.extensionPath, "debug", "simple-webview.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    panel.webview.html = html;

    // 웹뷰에서 메시지 수신
    panel.webview.onDidReceiveMessage(
      message => {
        console.log("웹뷰로부터 메시지 수신:", message.type, JSON.stringify(message));
        
        // 메시지 타입에 따라 처리
        switch (message.type) {
          case "debug":
            console.log("디버그 메시지:", message.action, message.message);
            // 응답 보내기
            panel.webview.postMessage({
              type: "debug_response",
              received: true,
              originalAction: message.action,
              timestamp: new Date().toISOString()
            });
            break;
            
          case "openSettings":
            vscode.commands.executeCommand("workbench.action.openSettings", "pythonRunnerChat");
            break;
            
          case "executeCode":
            const code = message.code;
            console.log(`실제 Python 코드 실행: ${code}`);
            
            // 실제 Python 코드 실행
            (async () => {
              try {
                // 로딩 상태 표시
                panel.webview.postMessage({ type: "statusUpdate", status: "loading" });
                
                // 코드 실행
                const result = await pythonRunner.executeCode(code);
                const codeItem = { id: "run-" + Date.now(), timestamp: new Date().toISOString() };
                
                // 에러 분석 (필요한 경우)
                let errorAnalysis = null;
                if (result.hasError) {
                  errorAnalysis = await errorAnalyzer.analyzeError(result.textOutput, code);
                }
                
                // 이미지 처리
                let imageData = null;
                if (result.imagePath) {
                  imageData = pythonRunner.getImageAsBase64(result.imagePath);
                }
                
                // 실행 결과 리턴
                panel.webview.postMessage({ 
                  type: "codeResult", 
                  result: {
                    ...result,
                    code: code,
                    codeItem: codeItem,
                    errorAnalysis,
                    imageData
                  }
                });
              } catch (error) {
                logError(error, "코드 실행 중 오류 발생");
                panel.webview.postMessage({ 
                  type: "error", 
                  text: "코드 실행 중 오류가 발생했습니다." 
                });
              }
            })();
            break;
            
          case "userMessage":
            console.log(`LLM 호출 실행: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`);
            
            // 실제 LLM 호출 수행
            (async () => {
              try {
                // 로딩 상태 표시
                panel.webview.postMessage({ type: "statusUpdate", status: "loading" });
                
                // LLM 호출
                const config = vscode.workspace.getConfiguration('pythonRunnerChat');
                const model = config.get<string>('model') || 'Qwen2.5-7B-Instruct-Q4_K_M';
                const systemPrompt = config.get<string>('systemPrompt') || 'You are a helpful Python runner.';
                
                console.log(`LLM 호출 설정 - 모델: ${model}, 시스템 프롭프트: ${systemPrompt.substring(0, 30)}...`);
                
                const res = await llm.chat.completions.create({
                  model: model,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message.text }
                  ]
                });
                
                const botReply = res.choices[0].message.content ?? "응답을 생성할 수 없습니다.";
                console.log(`LLM 응답 받음: ${botReply.substring(0, 50)}${botReply.length > 50 ? '...' : ''}`);
                
                // 응답 전송
                panel.webview.postMessage({ 
                  type: "botMessage", 
                  text: botReply,
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                logError(error, "LLM 호출 중 오류 발생");
                panel.webview.postMessage({ 
                  type: "error", 
                  text: "LLM 호출 중 오류가 발생했습니다. LM Studio 연결을 확인해 주세요." 
                });
              }
            })();
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

// 확장 비활성화 함수
export function deactivate() {}
