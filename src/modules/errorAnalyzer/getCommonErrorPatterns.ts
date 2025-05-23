import { ErrorPattern } from './ErrorPattern';

export function getCommonErrorPatterns(): ErrorPattern[] {
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
