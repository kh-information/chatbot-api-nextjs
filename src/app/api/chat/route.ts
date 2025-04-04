import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || '10', 10);
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간을 밀리초로

// IP 주소 가져오기 함수
async function getClientIP() {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0] : 'unknown';
}

// Rate limit 키 생성 함수
function getRateLimitKey(ip: string) {
  return `ratelimit:${ip}`;
}

// Rate limit 값 확인 함수 (GET용)
async function getRateLimitCount(ip: string) {
  const key = getRateLimitKey(ip);
  const count = await redis.get<number>(key) || 0;
  console.log(count)
  // await redis.del(key)
  return {
    remaining: Math.max(0, DAILY_LIMIT - count)
  };
}

// Rate limiting 함수 (POST용)
async function rateLimit(ip: string) {
  const key = getRateLimitKey(ip);
  const requestCount = await redis.incr(key);
  
  if (requestCount === 1) {
    await redis.pexpire(key, WINDOW_MS);
  }
  
  return {
    allowed: requestCount <= DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - requestCount)
  };
}

function corsHeaders(origin = '') {
  const allowedOrigins = [
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://khtest.co.kr',
    'https://kh-academy.co.kr',
  ];

  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  
  try {
    const ip = await getClientIP();
    const { remaining } = await getRateLimitCount(ip); // GET용 함수 사용

    return NextResponse.json({ remaining }, {
      headers: corsHeaders(origin)
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders(origin)
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  
  try {
    const { messages } = await req.json();
    const ip = await getClientIP();
    const { allowed, remaining } = await rateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "일일 사용 한도를 초과했습니다." },
        {
          status: 429,
          headers: corsHeaders(origin),
        }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
    });

    return NextResponse.json({
      content: response.choices[0].message,
      meta: { remaining }
    }, {
      headers: corsHeaders(origin)
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다." },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}
