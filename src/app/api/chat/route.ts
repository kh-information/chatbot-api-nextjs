import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


// CORS 헤더를 추가하는 함수
function corsHeaders(origin = '') {
  const allowedOrigins = [
    'http://127.0.0.1:8080', // 개발용 테스트 
    'kh-academy.co.kr', // 운영
  ];

  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}


// OPTIONS 요청 처리 (preflight request)
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '';

  try {
    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    // return NextResponse.json(response.choices[0].message);

    // 응답에 CORS 헤더 추가
    return NextResponse.json(response.choices[0].message, {
      headers: corsHeaders(origin)
    });
  } catch (error) {
    console.error("OpenAI API Error:", error); // ✅ error 사용하여 ESLint 오류 해결
    // return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    // 에러 응답에도 CORS 헤더 추가
    return NextResponse.json(
      { error: "Failed to fetch response" }, 
      { 
        status: 500,
        headers: corsHeaders(origin)
      }
    );
  }
}
