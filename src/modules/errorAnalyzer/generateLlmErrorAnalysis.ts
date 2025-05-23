import * as vscode from 'vscode';
import { llm } from '../../llm';

export async function generateLlmErrorAnalysis(errorMessage: string, code: string): Promise<string> {
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
