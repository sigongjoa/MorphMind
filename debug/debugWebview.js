"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 확장 활성화 함수
function activate(context) {
    console.log("디버그 웹뷰 확장이 활성화되었습니다.");
    // 명령 등록
    let disposable = vscode.commands.registerCommand("extension.openDebugWebview", () => {
        // 웹뷰 패널 생성
        const panel = vscode.window.createWebviewPanel("debugWebview", "Python Runner Debug", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        // HTML 파일 로드
        const htmlPath = path.join(context.extensionPath, "debug", "simple-webview.html");
        let html = fs.readFileSync(htmlPath, "utf8");
        panel.webview.html = html;
        // 웹뷰에서 메시지 수신
        panel.webview.onDidReceiveMessage(message => {
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
                    // 코드 실행 로직 (여기서는 더미 응답만 보냄)
                    setTimeout(() => {
                        panel.webview.postMessage({
                            type: "codeResult",
                            result: {
                                code: code,
                                textOutput: `[DEBUG] Code executed: ${code}`,
                                hasError: false,
                                codeItem: {
                                    id: "debug-" + Date.now(),
                                    timestamp: new Date().toISOString()
                                }
                            }
                        });
                    }, 1000);
                    break;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// 확장 비활성화 함수
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=debugWebview.js.map