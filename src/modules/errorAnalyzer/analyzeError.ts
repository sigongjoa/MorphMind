import { ErrorAnalysis } from './ErrorAnalysis';
import { getCommonErrorPatterns } from './getCommonErrorPatterns';
import { detectErrorType } from './detectErrorType';
import { generateLlmErrorAnalysis } from './generateLlmErrorAnalysis';

export async function analyzeError(errorMessage: string, code: string): Promise<ErrorAnalysis> {
    try {
      const errorPatterns = getCommonErrorPatterns();
      let quickFix: string | null = null;
      
      for (const pattern of errorPatterns) {
        if (pattern.regex.test(errorMessage)) {
          quickFix = pattern.fix;
          break;
        }
      }
      
      const llmAnalysis = await generateLlmErrorAnalysis(errorMessage, code);
      
      return {
        errorType: detectErrorType(errorMessage),
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
