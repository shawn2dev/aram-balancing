# ARAM Balancing

League of Legends 내전 팀 밸런싱 툴. AEM Live (Edge Delivery Services) 기반.

## Features

- 플레이어 이름 + 현재 티어 + 최고 티어 입력
- 6 / 8 / 10명 인원 선택
- 점수 = (현재 티어 + 최고 티어) 평균으로 팀 밸런싱
- Find Match 버튼으로 팀 자동 배정
- Reroll, 히스토리 (back/next), 수동 스왑, 클립보드 복사

## Tier Score Reference

| Tier | Score |
|------|-------|
| B (Bronze) | 1 |
| S (Silver) | 3 |
| SG (Silver ↔ Gold) | 4 |
| G (Gold) | 5 |
| GP (Gold ↔ Platinum) | 6 |
| P (Platinum) | 7 |
| PE (Platinum ↔ Emerald) | 8 |
| E (Emerald) | 9 |
| ED (Emerald ↔ Diamond) | 10 |
| D (Diamond) | 11 |
| DM (Diamond ↔ Master) | 12 |
| M (Master) | 13 |
| GM (Grandmaster) | 15 |
| C (Challenger) | 17 |

## Local Development

```bash
npm install -g @adobe/aem-cli
aem up
```

`http://localhost:3000` 에서 확인.

> `aem up` 실행 전 [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) 설치 및 content source 설정 필요.

## Project Structure

```
aram-balancing/
├── head.html                  # HTML head (Bootstrap 5, Font Awesome CDN)
├── fstab.yaml                 # Content source (Google Drive)
├── scripts/
│   ├── aem.js                 # AEM boilerplate utilities
│   ├── scripts.js             # Global JS entry point
│   └── utils.js               # Shared: defaultLevelMap, computeLevel
├── styles/
│   └── styles.css
└── blocks/
    ├── team-config/           # Player input UI block
    └── match-result/          # Balancing algorithm & result modal
```

## References

- [AEM Live Developer Tutorial](https://www.aem.live/developer/tutorial)
- [AEM Boilerplate](https://github.com/adobe/aem-boilerplate)
