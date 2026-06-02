# STOCK 30 배포 체크리스트

## 로컬 확인

- [ ] `npm install` 완료
- [ ] `npm run dev` 정상 실행
- [ ] `npm run build` 통과
- [ ] 모바일 화면 확인
- [ ] `/api/stocks/rankings` 정상 응답
- [ ] API 키가 없어도 mock fallback 동작
- [ ] 투자 고지 문구 표시 확인

## GitHub

- [ ] `git status` 확인
- [ ] `git add .`
- [ ] `git commit`
- [ ] `git push`

## Vercel

- [ ] New Project 생성
- [ ] GitHub repo 연결
- [ ] Environment Variables 입력
- [ ] Deploy 실행
- [ ] 배포 URL 접속 확인
- [ ] 모바일에서 배포 URL 접속 확인
- [ ] 배포 URL의 `/api/stocks/rankings` 확인

## Cron

- [ ] `vercel.json` 포함 확인
- [ ] `CRON_SECRET` 설정
- [ ] `/api/cron/update-rankings` 보호 확인
- [ ] Vercel Cron 로그 확인
- [ ] Hobby 플랜 제한 여부 확인
