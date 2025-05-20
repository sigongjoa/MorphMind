# Python Runner with Chat

Python 코드를 VSCode에서 대화형으로 실행하고 AI 기반 챗 인터페이스로 소통하는 확장 프로그램입니다.

![Python Runner Screenshot](https://via.placeholder.com/800x450.png?text=Python+Runner+Screenshot)

## 주요 기능

- **Python 코드 실행**: 별도의 터미널 없이 코드를 실행하고 결과를 바로 확인
- **대화형 AI 어시스턴트**: LLM 기반 AI 모델과 대화하며 Python 개발 도움 받기
- **코드 히스토리**: 실행했던 코드를 세션별로 저장하고 불러오기
- **변수 탐색기**: 코드 실행 후 생성된 변수 값을 실시간으로 확인
- **오류 분석**: Python 오류를 AI가 분석하여 해결 방법 제시

## 설치 방법

1. VSCode 마켓플레이스에서 "Python Runner with Chat" 검색
2. 확장 프로그램 설치
3. LM Studio 또는 호환 가능한 LLM API 서버 준비 (로컬에서 실행 권장)

## 필수 요구사항

- Visual Studio Code 1.60.0 이상
- Python 3.6 이상 (시스템에 설치됨)
- LM Studio 또는 OpenAI 호환 API 서버 (로컬 또는 원격)

## 시작하기

1. VSCode에서 명령 팔레트(Ctrl+Shift+P)를 열고 "Python Runner Chat" 실행
2. 채팅 창이 열리면 Python 코드 작성 또는 질문 입력
3. 코드 실행은 `실행` 버튼 또는 Ctrl+Enter로, 메시지 전송은 `전송` 버튼 또는 Shift+Enter로 가능

## 설정 옵션

| 설정 | 설명 | 기본값 |
|------|------|--------|
| `pythonRunnerChat.apiUrl` | LLM API 엔드포인트 URL | `http://localhost:1234/v1` |
| `pythonRunnerChat.model` | 사용할 LLM 모델명 | `Qwen2.5-7B-Instruct-Q4_K_M` |
| `pythonRunnerChat.systemPrompt` | AI 모델에 적용할 시스템 프롬프트 | `You are a helpful Python runner.` |
| `pythonRunnerChat.autoStart` | VSCode 시작 시 자동으로 채팅 창 열기 | `true` |
| `pythonRunnerChat.openPosition` | 채팅 창이 열릴 위치 (left, right, active) | `right` |
| `pythonRunnerChat.historyEnabled` | 코드 히스토리 저장 활성화 | `true` |
| `pythonRunnerChat.maxHistorySessions` | 최대 히스토리 세션 수 | `10` |
| `pythonRunnerChat.maxBookmarks` | 최대 북마크 수 | `50` |
| `pythonRunnerChat.variableExplorerEnabled` | 변수 탐색기 활성화 | `true` |
| `pythonRunnerChat.errorAnalysisEnabled` | 오류 분석 기능 활성화 | `true` |
| `pythonRunnerChat.inlineResultsEnabled` | 코드 실행 결과 인라인 표시 | `true` |

## LLM 설정

이 확장 프로그램은 OpenAI 호환 API를 사용하는 대규모 언어 모델(LLM)과 통합됩니다. 로컬 모델 사용을 위해 [LM Studio](https://lmstudio.ai/) 또는 유사한 로컬 LLM 서버를 활용할 수 있습니다.

### LM Studio 설정 방법

1. [LM Studio](https://lmstudio.ai/) 다운로드 및 설치
2. 원하는 모델 다운로드 (Qwen2.5-7B-Instruct 권장)
3. 로컬 서버 시작 (기본 주소: http://localhost:1234)
4. VSCode 설정에서 `pythonRunnerChat.apiUrl`과 `pythonRunnerChat.model` 설정 확인

## 주요 명령어

- `Python Runner Chat 열기`: 메인 인터페이스 열기
- `Python 코드 실행`: 선택한 코드 실행
- `새 Python 파일`: 새로운 Python 파일 생성
- `Python 파일 열기`: 기존 Python 파일 열기
- `코드 히스토리 보기`: 저장된 코드 히스토리 확인
- `북마크 보기`: 저장된 코드 북마크 확인
- `변수 탐색`: 현재 세션의 변수 값 확인
- `Python 오류 분석`: 발생한 오류에 대한 AI 분석 요청

## 인터페이스 설명

![Interface Guide](https://via.placeholder.com/800x450.png?text=Interface+Guide)

1. **헤더**: 설정, 새 파일, 파일 열기 등 기본 버튼
2. **메시지 영역**: 코드 실행 결과와 대화 내용이 표시
3. **입력 영역**: Python 코드나 질문을 입력하는 곳
4. **실행/전송 버튼**: 코드 실행(▶️) 또는 메시지 전송(➤) 버튼
5. **상태 표시줄**: 현재 상태 및 로딩 상태 표시

## 문제 해결

### 전송 버튼이 보이지 않는 경우
- 확장 프로그램을 재시작하거나 VSCode를 재시작합니다
- 문제가 지속되면 CSS 테마 충돌 가능성이 있으므로 다른 테마로 변경해보세요

### LLM 연결 오류
- LM Studio 서버가 실행 중인지 확인
- apiUrl 설정이 올바른지 확인 (기본값: http://localhost:1234/v1)
- 모델명이 LM Studio에서 로드된 모델과 일치하는지 확인

### Python 실행 오류
- Python이 시스템 경로에 설치되어 있는지 확인
- VSCode Python 확장 프로그램이 설치되어 있는지 확인

## FAQ

**Q: 로컬 LLM이 아닌 OpenAI API를 사용할 수 있나요?**  
A: 네, `pythonRunnerChat.apiUrl` 설정을 `https://api.openai.com/v1`로 변경하고 API 키를 설정하면 사용 가능합니다.

**Q: 코드 실행 결과를 파일로 저장할 수 있나요?**  
A: 현재 버전에서는 직접 지원하지 않습니다. 추후 업데이트에서 추가될 예정입니다.

**Q: 다른 언어도 지원하나요?**  
A: 현재는 Python만 지원합니다. 향후 버전에서 다른 언어 지원을 검토 중입니다.

## 로깅 및 디버깅

이 확장 프로그램은 자세한 로깅을 지원합니다:
- 로그 형식: JSON (timestamp, level, message, trace)
- 오류 발생 시 스택 트레이스 전체 출력 (ERROR 레벨)
- 장애 상황에서 디버그 로그 활성화: VSCode 명령 팔레트에서 "Debug Python Runner" 실행

## 기여하기

이 프로젝트에 기여하고 싶으시다면:
1. GitHub 저장소 포크
2. 기능 개발 또는 버그 수정
3. 풀 리퀘스트 제출

## 라이선스

MIT License
