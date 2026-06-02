# STOCK 30

온라인 관심도, 뉴스 노출, 검색 흐름, 가격 데이터를 기반으로 국내/해외 주식 TOP 30 관심도 랭킹을 보여주는 웹사이트입니다.

이 서비스는 투자 추천 서비스가 아니라 온라인 관심도 흐름을 보여주는 참고 정보 서비스입니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 등록합니다.

```env
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
ALPHA_VANTAGE_API_KEY=
CRON_SECRET=
ENABLE_GDELT=false
ENABLE_STOCKTWITS=false
```

민감한 키에는 `NEXT_PUBLIC_` 접두사를 사용하지 않습니다. 외부 데이터 호출은 서버 Route Handler에서만 실행합니다.

## 데이터 소스

기본 활성 소스:

- Google News RSS
- Yahoo Finance RSS
- Hacker News Algolia Search

선택 활성 소스:

- Naver DataLab: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 필요
- Alpha Vantage: `ALPHA_VANTAGE_API_KEY` 필요
- GDELT: `ENABLE_GDELT=true`일 때만 사용
- Stocktwits: `ENABLE_STOCKTWITS=true`일 때만 사용

GDELT와 Stocktwits는 무료 접근 안정성이 낮거나 호출 제한이 강해 기본값은 비활성화했습니다.

## API

### `GET /api/stocks/rankings`

랭킹 데이터를 반환합니다.

응답에는 `updatedAt`, `nextUpdateAt`, `updateIntervalHours`, `sourceStatus`, `stocks`가 포함됩니다. 외부 API 호출이 실패해도 mock fallback을 반환해 화면이 계속 표시됩니다.

### `GET /api/cron/update-rankings`

랭킹 캐시를 갱신하는 endpoint입니다.

운영 환경에서는 다음 헤더가 필요합니다.

```http
Authorization: Bearer ${CRON_SECRET}
```

## Vercel 배포

1. GitHub에 프로젝트를 push합니다.
2. Vercel에서 New Project를 선택합니다.
3. GitHub repository를 연결합니다.
4. Framework Preset은 `Next.js`를 선택합니다.
5. Project Settings > Environment Variables에 환경변수를 입력합니다.
6. Deploy를 클릭합니다.
7. 배포 완료 후 생성된 URL에서 화면을 확인합니다.
8. `/api/stocks/rankings`가 배포 URL에서도 정상 응답하는지 확인합니다.

## Cron

Vercel Hobby 플랜은 cron 실행 횟수 제한이 있을 수 있습니다. 6시간마다 자동 업데이트가 필요하면 Vercel Pro 플랜 또는 외부 cron 서비스를 고려해야 합니다.

현재 저장소는 DB에 연결되어 있지 않습니다. 서버리스 환경의 in-memory cache는 영구 저장소가 아니므로 추후 Supabase, Vercel KV, Redis 등을 연결할 수 있도록 캐시 함수가 분리되어 있습니다.

## 보안 및 운영 주의

- API 키는 Vercel Environment Variables에만 입력합니다.
- 민감한 값에는 `NEXT_PUBLIC_` 접두사를 사용하지 않습니다.
- 외부 API 호출은 서버 Route Handler 또는 서버 유틸에서만 실행합니다.
- 무료 API는 호출 제한이 있을 수 있으므로 cron 주기와 수동 새로고침 빈도를 확인합니다.
- 현재 in-memory cache는 영구 저장소가 아닙니다.
- 실제 운영에서는 Supabase, Vercel KV, Redis 같은 저장소와 rate limit 저장소를 연결하는 것을 권장합니다.

## 고지

STOCK 30은 온라인 관심도, 뉴스 노출, 검색 흐름, 가격 데이터를 기반으로 산출한 참고 분석 서비스입니다. 본 서비스의 지표는 투자 추천이나 매매 신호가 아니며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.
