import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logError } from '../llm';

export class PythonRunner {
  private pythonProcess: cp.ChildProcess | null = null;
  private resultsFolder: string;
  private executionCounter: number = 0;

  constructor(storagePath: string) {
    this.resultsFolder = path.join(storagePath, 'results');
    this.ensureDirectory(this.resultsFolder);
  }

  // 디렉토리 존재 확인 및 생성
  private ensureDirectory(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  // Python 인터프리터 경로 가져오기
  private getPythonPath(): string | undefined {
    const pythonConfig = vscode.workspace.getConfiguration('python');
    return pythonConfig.get<string>('defaultInterpreterPath') || 
           pythonConfig.get<string>('pythonPath');
  }

  // 코드 실행
  async executeCode(code: string): Promise<ExecutionResult> {
    this.executionCounter++;
    const resultId = `exec_${Date.now()}_${this.executionCounter}`;
    
    try {
      // 결과 파일 경로
      const outputTextPath = path.join(this.resultsFolder, `${resultId}.txt`);
      const outputImgPath = path.join(this.resultsFolder, `${resultId}.png`);
      
      // Python 인터프리터 경로 가져오기
      const pythonPath = this.getPythonPath();
      if (!pythonPath) {
        return {
          id: resultId,
          textOutput: 'Python 인터프리터를 찾을 수 없습니다.',
          hasError: true
        };
      }

      // 그래프 출력 코드 추가 (matplotlib 사용 시)
      const codeWithGraphCapture = `
import sys
import traceback

try:
    # matplotlib 그래프 출력 캡처 설정
    try:
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use('Agg')
        _has_matplotlib = True
    except ImportError:
        _has_matplotlib = False

    # 사용자 코드 실행
${code.split('\n').map(line => '    ' + line).join('\n')}

    # 그래프가 생성됐는지 확인하고 저장
    if _has_matplotlib and plt.get_fignums():
        plt.savefig('${outputImgPath.replace(/\\/g, '\\\\')}')
        print("\\n[이미지 결과가 생성되었습니다]")
        plt.close()
except Exception as e:
    print("\\n[오류 발생]\\n")
    traceback.print_exc()
`;

      // 코드를 임시 파일로 저장
      const tempScriptPath = path.join(this.resultsFolder, `${resultId}.py`);
      fs.writeFileSync(tempScriptPath, codeWithGraphCapture, 'utf8');
      
      // Python 프로세스 실행
      return new Promise((resolve) => {
        const pythonProcess = cp.spawn(pythonPath, [tempScriptPath], {
          shell: true
        });
        
        let output = '';
        let errorOutput = '';
        let hasError = false;
        
        // 출력 처리
        pythonProcess.stdout.on('data', (data) => {
          const text = data.toString();
          output += text;
        });
        
        // 오류 처리
        pythonProcess.stderr.on('data', (data) => {
          const text = data.toString();
          errorOutput += text;
          hasError = true;
        });
        
        // 프로세스 종료 처리
        pythonProcess.on('close', (code) => {
          // 결과 저장
          const allOutput = output + (errorOutput ? `\n${errorOutput}` : '');
          fs.writeFileSync(outputTextPath, allOutput, 'utf8');
          
          // 결과 반환
          const hasImage = fs.existsSync(outputImgPath);
          const result: ExecutionResult = {
            id: resultId,
            textOutput: allOutput,
            hasError,
            imagePath: hasImage ? outputImgPath : undefined
          };
          
          // 임시 스크립트 파일 삭제
          fs.unlinkSync(tempScriptPath);
          
          resolve(result);
        });
      });
    } catch (error) {
      logError(error, '코드 실행 중 오류 발생');
      return {
        id: resultId,
        textOutput: '코드 실행 중 오류가 발생했습니다: ' + String(error),
        hasError: true
      };
    }
  }

  // Base64로 인코딩된 이미지 가져오기
  getImageAsBase64(imagePath: string): string | null {
    try {
      if (fs.existsSync(imagePath)) {
        const imageData = fs.readFileSync(imagePath);
        return `data:image/png;base64,${imageData.toString('base64')}`;
      }
      return null;
    } catch (error) {
      logError(error, '이미지 인코딩 중 오류 발생');
      return null;
    }
  }

  // 실행 결과 삭제
  deleteResult(resultId: string): void {
    try {
      const textPath = path.join(this.resultsFolder, `${resultId}.txt`);
      const imagePath = path.join(this.resultsFolder, `${resultId}.png`);
      
      if (fs.existsSync(textPath)) {
        fs.unlinkSync(textPath);
      }
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (error) {
      logError(error, '결과 삭제 중 오류 발생');
    }
  }

  // 정리
  dispose() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}

// 실행 결과 인터페이스
export interface ExecutionResult {
  id: string;
  textOutput: string;
  hasError: boolean;
  imagePath?: string;
}
