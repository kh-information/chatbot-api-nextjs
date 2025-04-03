# Chatbot Next.js Project

## 설치 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd chatbot-next
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
- `.env.example` 파일을 `.env.local`로 복사
- `.env.local` 파일에 실제 값들을 입력
```bash
cp .env.example .env.local
```

4. 개발 서버 실행
```bash
npm run dev
```

## 필요한 환경 변수
- OPENAI_API_KEY: OpenAI API 키
- UPSTASH_REDIS_REST_URL: Upstash Redis URL
- UPSTASH_REDIS_REST_TOKEN: Upstash Redis 토큰
- DAILY_LIMIT: 일일 사용 제한 횟수

## 기술 스택
- Next.js
- TypeScript
- OpenAI API
- Upstash Redis
