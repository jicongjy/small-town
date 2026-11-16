# 할머니의 마을 노트

할머니가 남긴 노트를 들고, 의뢰인의 빈 땅에 조각을 놓아 마을을 지어 주는 배치 퍼즐 게임.

- 설치할 것 없는 순수 웹 파일이다. `index.html`을 웹 서버로 열면 된다.
- 내 컴퓨터에서 열기: `python3 -m http.server 4173` 실행 후 http://localhost:4173
- 기획 내용은 `docs/기획.md`, 숫자와 대사는 `js/data.js`에 있다.
- 난이도 확인: `node tools/sim.js`

## 파일

| 파일 | 내용 |
|---|---|
| `js/sprites.js` | 도트 그림과 색 |
| `js/data.js` | 조각, 유물, 의뢰, 대사 |
| `js/engine.js` | 게임 규칙 |
| `js/ui.js` | 화면 |
| `tools/sim.js` | 자동으로 여러 판을 두어 난이도를 재는 도구 |
