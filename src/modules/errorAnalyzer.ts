import * as vscode from 'vscode';
import { llm } from '../llm';

export class ErrorAnalyzer {
  // 에러 메시지 파싱 및 분석
  async analyzeError(errorMessage: string, code: string): Promise<ErrorAnalysis> {
    try {
      // 간단한 에러 패턴 분석
      const errorPatterns = this.getCommonErrorPatterns();
      let quickFix: string | null = null;
      
      // 간단한 에러 패턴 매칭
      for (const pattern of errorPatterns) {
        if (pattern.regex.test(errorMessage)) {
          quickFix = pattern.fix;
          break;
        }
      }
      
      // LLM 기반 분석 생성
      const llmAnalysis = await this.generateLlmErrorAnalysis(errorMessage, code);
      
      return {
        errorType: this.detectErrorType(errorMessage),
        quickFix: quickFix,
        llmAnalysis: llmAnalysis
      };
    } catch (error) {
      console.error('에러 분석 중 오류 발생:', error);
      return {
        errorType: 'UnknownError',
        quickFix: null,
        llmAnalysis: '오류 분석을 생성할 수 없습니다.'
      };
    }
  }

  // LLM을 사용한 에러 분석 생성
  private async generateLlmErrorAnalysis(errorMessage: string, code: string): Promise<string> {
    try {
      const config = vscode.workspace.getConfiguration('pythonRunnerChat');
      const model = config.get<string>('model') || 'Qwen2.5-7B-Instruct-Q4_K_M';
      
      const prompt = `아래 Python 코드에서 발생한 오류를 분석하고 해결 방법을 제안해주세요. 간결하고 명확하게 설명해 주세요.

코드:
\`\`\`python
${code}
\`\`\`

오류 메시지:
\`\`\`
${errorMessage}
\`\`\`

가능한 원인과 해결책:`;
      
      const res = await llm.chat.completions.create({
        model: model,
        messages: [
          { role: "user", content: prompt }
        ]
      });
      
      return res.choices[0].message.content || '분석을 생성할 수 없습니다.';
    } catch (error) {
      console.error('LLM 에러 분석 생성 중 오류 발생:', error);
      return '분석을 생성할 수 없습니다. LLM 서비스 연결을 확인해 주세요.';
    }
  }

  // 일반적인 Python 에러 패턴 정의
  private getCommonErrorPatterns(): ErrorPattern[] {
    return [
      {
        regex: /NameError: name '(.+)' is not defined/,
        fix: '변수 이름이 정의되지 않았습니다. 변수를 사용하기 전에 정의했는지 확인하세요.'
      },
      {
        regex: /TypeError: unsupported operand type\(s\) for (.+): '(.+)' and '(.+)'/,
        fix: '타입 오류가 발생했습니다. 서로 다른 타입의 데이터를 잘못된 방식으로 연산했습니다.'
      },
      {
        regex: /SyntaxError: invalid syntax/,
        fix: '문법 오류가 있습니다. 괄호, 콜론, 들여쓰기를 확인해 보세요.'
      },
      {
        regex: /IndentationError: (.+)/,
        fix: '들여쓰기 오류가 있습니다. 들여쓰기 수준이 일관적인지 확인하세요.'
      },
      {
        regex: /IndexError: list index out of range/,
        fix: '리스트 인덱스 오류입니다. 리스트의 범위를 벗어난 인덱스에 접근했습니다.'
      },
      {
        regex: /KeyError: (.+)/,
        fix: '딕셔너리 키 오류입니다. 존재하지 않는 키에 접근했습니다.'
      },
      {
        regex: /ImportError: No module named (.+)/,
        fix: '모듈 가져오기 오류입니다. 해당 모듈이 설치되어 있는지 확인하세요.'
      },
      {
        regex: /ValueError: (.+)/,
        fix: '값 오류가 발생했습니다. 함수나 연산에 부적절한 값이 전달되었습니다.'
      },
      {
        regex: /ZeroDivisionError/,
        fix: '0으로 나누기 오류입니다. 나누는 수가 0이 아닌지 확인하세요.'
      },
      {
        regex: /AttributeError: (.+) has no attribute '(.+)'/,
        fix: '속성 오류입니다. 객체에 존재하지 않는 속성에 접근했습니다.'
      }
    ];
  }

  // 에러 타입 감지
  private detectErrorType(errorMessage: string): string {
    const errorTypes = [
      'SyntaxError', 'NameError', 'TypeError', 'IndexError',
      'KeyError', 'ValueError', 'ImportError', 'AttributeError',
      'IndentationError', 'ZeroDivisionError'
    ];
    
    for (const errorType of errorTypes) {
      if (errorMessage.includes(errorType)) {
        return errorType;
      }
    }
    
    return 'UnknownError';
  }
}

// 에러 패턴 인터페이스
interface ErrorPattern {
  regex: RegExp;
  fix: string;
}

// 에러 분석 인터페이스
export interface ErrorAnalysis {
  errorType: string;
  quickFix: string | null;
  llmAnalysis: string;
}
