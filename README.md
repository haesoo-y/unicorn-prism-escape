# 개발 명령

- `npm install`: 개발 의존성 설치
- `npm run check`: strict TypeScript 타입 검사
- `npm run dev`: 로컬 개발 서버 실행
- `npm run debug`: 디버그 빌드 생성
- `npm run prod`: production 빌드 생성
- `npm run zip`: 제출용 ZIP 생성
- `npm run size`: production HTML과 ZIP 크기 출력

## Release verification

Run `npm run check`, `npm run debug`, `npm run zip`, and `npm run size`. The ZIP limit is 13,312 bytes.

- `node tools/production-regression.mjs`: minified source regressions, two passes.
- `node tools/package-check.mjs`: ZIP contents, CRC, and embedded assets, two passes.
- `node tools/production-smoke.mjs`: debug/packed production in a Node VM, two passes.
- `node tools/playthrough-simulation.mjs`: advisory bot with normal gameplay rules, three seeds twice; failure is a finding, not a browser test failure.

These tools do not replace browser, real touch, audio listening, or human difficulty checks. See `QA-2026-09-12.md` for completed checks and remaining limitations. Rebuild the review dashboard with `node tools/build-dashboard.mjs`; it is excluded from the game ZIP.

The target duration for a full 10-stage run is approximately 5 minutes (300 seconds), excluding skill selection. This is a design target, not a verified human completion time.
