import * as vscode from 'vscode';
import * as cp from 'child_process';
import { logError } from '../llm';

export class VariableExplorer {
  private pythonProcess: cp.ChildProcess | null = null;
  private variablesData: VariableData[] = [];

  constructor() {
    // 변수 탐색기 초기화
  }

  // Python 프로세스 시작 및 연결
  startPythonProcess(): boolean {
    try {
      // Python 인터프리터 경로 가져오기
      const pythonPath = this.getPythonPath();
      
      if (!pythonPath) {
        vscode.window.showErrorMessage('Python 인터프리터를 찾을 수 없습니다.');
        return false;
      }

      // Python 프로세스 시작 (주피터 커널과 유사한 REPL 환경)
      this.pythonProcess = cp.spawn(pythonPath, ['-i'], {
        shell: true
      });

      // 스트림 인코딩 설정
      this.pythonProcess.stdout?.setEncoding('utf8');
      this.pythonProcess.stderr?.setEncoding('utf8');

      // 출력 처리
      this.pythonProcess.stdout?.on('data', (data) => {
        console.log('Python 출력:', data.toString());
      });

      // 오류 처리
      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('Python 오류:', data.toString());
      });

      // 프로세스 종료 처리
      this.pythonProcess.on('close', (code) => {
        console.log(`Python 프로세스 종료됨 (코드: ${code})`);
        this.pythonProcess = null;
      });

      console.log('Python 프로세스 시작됨');
      return true;
    } catch (error) {
      logError(error, 'Python 프로세스 시작 중 오류 발생');
      return false;
    }
  }

  // Python 인터프리터 경로 가져오기
  private getPythonPath(): string | undefined {
    const pythonConfig = vscode.workspace.getConfiguration('python');
    return pythonConfig.get<string>('defaultInterpreterPath') ||
           pythonConfig.get<string>('pythonPath');
  }

  // 코드 실행 및 변수 가져오기
  async executeCodeAndGetVariables(code: string): Promise<{ result: string, variables: VariableData[] }> {
    try {
      if (!this.pythonProcess) {
        const started = this.startPythonProcess();
        if (!started) {
          return { result: '변수 탐색기를 시작할 수 없습니다.', variables: [] };
        }
      }

      // 코드 실행
      const result = await this.executeCode(code);
      
      // 변수 목록 가져오기
      const variables = await this.getVariables();

      return { result, variables };
    } catch (error) {
      logError(error, '코드 실행 및 변수 가져오기 중 오류 발생');
      return { result: '코드 실행 중 오류가 발생했습니다.', variables: [] };
    }
  }

  // 코드 실행
  private executeCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess || !this.pythonProcess.stdin) {
        return reject(new Error('Python 프로세스가 실행 중이 아닙니다.'));
      }

      let output = '';
      let errorOutput = '';

      // 출력 처리
      const stdoutHandler = (data: Buffer) => {
        output += data.toString();
      };

      // 오류 처리
      const stderrHandler = (data: Buffer) => {
        errorOutput += data.toString();
      };

      this.pythonProcess.stdout?.on('data', stdoutHandler);
      this.pythonProcess.stderr?.on('data', stderrHandler);

      // 출력 캡처를 위한 코드 구성
      const wrappedCode = `
import sys
import io
import traceback

_original_stdout = sys.stdout
_original_stderr = sys.stderr
_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture

try:
    ${code.replace(/\n/g, '\n    ')}
except Exception as e:
    traceback.print_exc()

sys.stdout = _original_stdout
sys.stderr = _original_stderr
print("STDOUT_CAPTURE:" + _stdout_capture.getvalue())
print("STDERR_CAPTURE:" + _stderr_capture.getvalue())
`;

      // 코드 전송
      this.pythonProcess.stdin.write(wrappedCode + '\n');

      // 결과 수집 (타임아웃 처리 포함)
      setTimeout(() => {
        this.pythonProcess?.stdout?.removeListener('data', stdoutHandler);
        this.pythonProcess?.stderr?.removeListener('data', stderrHandler);

        if (errorOutput) {
          resolve(`오류 발생:\n${errorOutput}`);
        } else {
          // STDOUT_CAPTURE: 및 STDERR_CAPTURE: 부분 추출
          const stdoutMatch = output.match(/STDOUT_CAPTURE:(.*?)(?=STDERR_CAPTURE:|$)/s);
          const stderrMatch = output.match(/STDERR_CAPTURE:(.*?)$/s);
          
          const stdoutResult = stdoutMatch ? stdoutMatch[1] : '';
          const stderrResult = stderrMatch ? stderrMatch[1] : '';
          
          resolve(stderrResult ? `오류 발생:\n${stderrResult}` : stdoutResult);
        }
      }, 3000);
    });
  }

  // 변수 목록 가져오기
  public async getVariables(): Promise<VariableData[]> {
    try {
      if (!this.pythonProcess || !this.pythonProcess.stdin) {
        return [];
      }

      // 변수 추출 코드
      const variableCode = `
import json
import inspect
import sys

def get_variables():
    variables = []
    for name, value in inspect.currentframe().f_back.f_globals.items():
        if name.startswith('_'):
            continue
        try:
            type_name = type(value).__name__
            str_val = str(value)
            # 너무 긴 문자열은 자르기
            if len(str_val) > 100:
                str_val = str_val[:100] + '...'
            
            # 기본 타입 확인
            if isinstance(value, (int, float, bool, str)):
                is_expandable = False
            elif isinstance(value, (list, dict, tuple, set)):
                is_expandable = True
            else:
                is_expandable = hasattr(value, '__dict__') or hasattr(value, '__slots__')
            
            if isinstance(value, (list, tuple)):
                length = len(value)
            elif isinstance(value, dict):
                length = len(value)
            else:
                length = None
            
            variables.append({
                'name': name,
                'type': type_name,
                'value': str_val,
                'expandable': is_expandable,
                'length': length
            })
        except:
            continue
    return variables

print("VARIABLES_JSON:" + json.dumps(get_variables()))
`;

      let output = '';

      // 출력 처리
      const stdoutHandler = (data: Buffer) => {
        output += data.toString();
      };

      this.pythonProcess.stdout?.on('data', stdoutHandler);

      // 코드 전송
      this.pythonProcess.stdin.write(variableCode + '\n');

      // 변수 정보 추출
      return new Promise((resolve) => {
        setTimeout(() => {
          this.pythonProcess?.stdout?.removeListener('data', stdoutHandler);
          
          // JSON 응답 추출
          const variablesMatch = output.match(/VARIABLES_JSON:(.+)$/m);
          if (variablesMatch && variablesMatch[1]) {
            try {
              const variablesData = JSON.parse(variablesMatch[1]) as VariableData[];
              this.variablesData = variablesData;
              resolve(variablesData);
            } catch (e) {
              console.error('변수 데이터 파싱 오류:', e);
              resolve([]);
            }
          } else {
            resolve([]);
          }
        }, 1000);
      });
    } catch (error) {
      logError(error, '변수 목록 가져오기 중 오류 발생');
      return [];
    }
  }

  // 특정 변수 확장 (중첩 데이터 가져오기)
  async expandVariable(variableName: string): Promise<VariableData[]> {
    try {
      if (!this.pythonProcess || !this.pythonProcess.stdin) {
        return [];
      }

      // 변수 확장 코드
      const expandCode = `
import json
import inspect

def expand_variable(var_name):
    value = globals().get(var_name)
    if value is None:
        return []
    
    expanded = []
    try:
        if isinstance(value, (list, tuple)):
            for i, item in enumerate(value):
                expanded.append({
                    'name': f'[{i}]',
                    'type': type(item).__name__,
                    'value': str(item)[:100],
                    'expandable': not isinstance(item, (int, float, bool, str)),
                    'parent': var_name
                })
        elif isinstance(value, dict):
            for k, item in value.items():
                expanded.append({
                    'name': f'["{k}"]' if isinstance(k, str) else f'[{k}]',
                    'type': type(item).__name__,
                    'value': str(item)[:100],
                    'expandable': not isinstance(item, (int, float, bool, str)),
                    'parent': var_name
                })
        elif hasattr(value, '__dict__'):
            for attr, item in value.__dict__.items():
                if not attr.startswith('_'):
                    expanded.append({
                        'name': attr,
                        'type': type(item).__name__,
                        'value': str(item)[:100],
                        'expandable': not isinstance(item, (int, float, bool, str)),
                        'parent': var_name
                    })
    except:
        pass
    return expanded

print("EXPANDED_JSON:" + json.dumps(expand_variable('${variableName}')))
`;

      let output = '';

      // 출력 처리
      const stdoutHandler = (data: Buffer) => {
        output += data.toString();
      };

      this.pythonProcess.stdout?.on('data', stdoutHandler);

      // 코드 전송
      this.pythonProcess.stdin.write(expandCode + '\n');

      // 확장 정보 추출
      return new Promise((resolve) => {
        setTimeout(() => {
          this.pythonProcess?.stdout?.removeListener('data', stdoutHandler);
          
          // JSON 응답 추출
          const expandedMatch = output.match(/EXPANDED_JSON:(.+)$/m);
          if (expandedMatch && expandedMatch[1]) {
            try {
              const expandedData = JSON.parse(expandedMatch[1]) as VariableData[];
              resolve(expandedData);
            } catch (e) {
              console.error('확장 데이터 파싱 오류:', e);
              resolve([]);
            }
          } else {
            resolve([]);
          }
        }, 1000);
      });
    } catch (error) {
      logError(error, '변수 확장 중 오류 발생');
      return [];
    }
  }

  // 프로세스 종료
  dispose() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}

// 변수 데이터 인터페이스
export interface VariableData {
  name: string;
  type: string;
  value: string;
  expandable: boolean;
  length?: number;
  parent?: string;
}
