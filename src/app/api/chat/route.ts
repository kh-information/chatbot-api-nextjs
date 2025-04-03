import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Redis } from '@upstash/redis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DAILY_LIMIT = 1;

function getTodayKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `limit:${userId}:${today}`;
}

function corsHeaders(origin = '') {
  const allowedOrigins = [
    'http://127.0.0.1:8080',
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

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const body = await req.json();
  const { messages, userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }

  const key = getTodayKey(userId);
  const current = await redis.get<number>(key);

  if ((current || 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "하루 질문 횟수를 초과했습니다." },
      {
        status: 429,
        headers: corsHeaders(origin),
      }
    );
  }

  // 요청 수 증가 및 TTL 설정
  await redis.incr(key);
  if (current === null) {
    await redis.expire(key, 60 * 60 * 24); // 24시간 유지
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    return NextResponse.json(response.choices[0].message, {
      headers: corsHeaders(origin),
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch response" },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}
