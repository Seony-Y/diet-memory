# Diet Memory

개인용 식단, 몸무게, 물, 운동 및 시술 일정을 기록하는 모바일 우선 PWA입니다.

## Stack

- React 19, TypeScript, Vite
- Neon PostgreSQL, Managed Better Auth, Data API, Row Level Security
- PWA, Recharts, Lucide React
- Cloudflare Pages

## Architecture

```text
src/
├─ app/          # 앱 상태 조합, 내비게이션, 전역 타입
├─ features/     # 업무 기능별 화면, 상태, 폼, 스타일
│  ├─ assistant/
│  ├─ body/
│  ├─ dashboard/
│  ├─ ingredients/
│  ├─ nutrition/
│  ├─ records/
│  ├─ schedule/
│  └─ statistics/
├─ lib/          # 외부 서비스 클라이언트
├─ mocks/        # 개발 모드에서만 동적 로딩하는 목업 데이터
└─ shared/       # 여러 기능이 함께 쓰는 UI
```

기능 코드는 가능한 한 해당 `features` 폴더 안에 두고, 두 기능 이상이 공유할 때만 `shared`로 이동합니다. `mocks`는 `import.meta.env.DEV`에서만 동적 로딩하므로 프로덕션 번들에 포함되지 않습니다. Neon 테이블 타입과 쿼리는 연결 시 각 기능의 `api.ts`에 배치합니다.

## Local setup

```powershell
npm install; Copy-Item .env.example .env.local; npm run dev
```

Neon 프로젝트의 AWS 리전에 Managed Better Auth와 Data API를 활성화한 뒤 SQL Editor에서 `neon/migrations/202610070001_initial_schema.sql`을 실행합니다. Data API의 HTTPS 데이터베이스 URL을 `.env.local`의 `VITE_NEON_DATABASE_URL`에 입력합니다. `postgresql://`로 시작하는 연결 문자열과 데이터베이스 비밀번호는 브라우저 환경변수에 넣지 않습니다.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Variables: `VITE_NEON_DATABASE_URL`

검증 명령은 `npm run format:check; npm run lint; npm run build`입니다. 전체 소스 포맷은 `npm run format`으로 적용합니다.

## Vite reference

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
