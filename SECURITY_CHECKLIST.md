# STOCK 30 보안 체크리스트

## 환경변수

- [ ] `.env.local`은 git에 포함하지 않음
- [ ] API 키에 `NEXT_PUBLIC_` 접두사 사용 없음
- [ ] Vercel Environment Variables에만 실제 키 등록
- [ ] `.env.local.example`에는 빈 값만 포함

## API Route

- [ ] 외부 API 호출은 서버에서만 수행
- [ ] `/api/stocks/rankings` rate limit 적용
- [ ] `/api/cron/update-rankings` CRON_SECRET 보호
- [ ] API 실패 시 mock fallback 동작
- [ ] 에러 응답에 API 키, secret, header, 전체 외부 URL 노출 없음

## 데이터 소스

- [ ] GDELT timeout 처리
- [ ] Google News RSS timeout 처리
- [ ] Naver DataLab 키 없을 때 disabled 처리
- [ ] Alpha Vantage 키 없을 때 disabled 처리
- [ ] Stocktwits 실패 시 fallback 처리
- [ ] symbol, market, query 입력값 검증

## UI 및 문구

- [ ] 투자 추천 아님 고지 표시
- [ ] 거래 권유 표현 없음
- [ ] 단정적 전망 표현 없음
- [ ] 이번주 상승확률은 참고 분석 지표로 표시

## 배포

- [ ] `npm run build` 통과
- [ ] Vercel 환경변수 설정
- [ ] Cron Secret 설정
- [ ] 배포 URL에서 rankings API 확인
- [ ] 모바일 화면 확인
