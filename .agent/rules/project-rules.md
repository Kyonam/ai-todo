# AI 할 일 관리 웹 서비스 개발 규칙

## 1. 프로젝트 특성
- **기반 프레임워크**: Next.js 15 App Router
- **사용자 경험(UX) 최우선**:
  - 로딩(Loading), 빈 상태(Empty), 오류(Error) UI를 빠짐없이 구현합니다.
  - 사용자 상호작용 시 지연을 최소화합니다.
- **철저한 오류 처리**:
  - 서버 및 클라이언트 전반에서 예외를 포착합니다.
  - 사용자에게는 이해하기 쉬운 친절한 한글 오류 메시지를 표시합니다.
  - 개발 환경(Development)에서는 문제 해결을 위해 상세한 로그를 출력합니다.

## 2. 기술 스택
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (필수 사용, Strict 모드 권장)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend/Database/Auth**: Supabase
- **AI Integration**: AI SDK (LLM 모델 연동)
- **Code Quality**: ESLint (Next.js 및 TypeScript 규칙 기반)

## 3. 코딩 스타일
- **컴포넌트 정의**: 함수형 컴포넌트(Functional Component)를 기본으로 사용합니다.
- **함수 스타일**: 모든 함수는 화살표 함수(`const func = () => {}`) 문법을 사용합니다.
- **파일 명명 규칙**: 컴포넌트 파일명은 파스칼 케이스(PascalCase)를 따릅니다.
  - 예시: `TodoList.tsx`, `TaskItem.tsx`
- **주석 및 문서화**:
  - 함수와 컴포넌트 최상단에는 해당 기능을 설명하는 한글 주석을 한 문장으로 작성합니다.
  - JSDoc을 작성할 경우에도 한글로 기술합니다.
- **린팅**: ESLint 규칙을 철저히 준수하여 코드 품질을 유지합니다.
