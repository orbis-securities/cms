import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (환경변수가 없으면 더미 키로 초기화)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 503 }
      );
    }

    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // AI 자동완성 프롬프트 구성
    const systemPrompt = `
    You are a professional blog writer assistant specializing in financial markets and trading. 
    Help users continue their blog posts with high-quality, informative content.
    
    Guidelines:
    - Write in Korean for Korean content, English for English content
    - Keep the tone professional but accessible
    - Focus on providing valuable insights
    - Use proper formatting (markdown supported)
    - Avoid making specific investment recommendations
    - Include relevant financial terminology when appropriate
    `;

    const userPrompt = `
    Context: ${context || 'Blog post about financial markets'}
    
    Continue this text naturally: "${prompt}"
    
    Please provide a continuation that:
    1. Flows naturally from the existing text
    2. Adds value for readers
    3. Is approximately 100-200 words
    4. Maintains the same writing style and tone
    `;

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      completion: generatedText,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('AI 생성 에러:', error);

    // OpenAI API 에러 처리
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { 
          error: 'AI 서비스 오류가 발생했습니다.',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Streaming 버전 (실시간 타이핑 효과)
export async function GET(request: NextRequest) {
  // OpenAI API 키 확인
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt');
  const context = searchParams.get('context');

  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful blog writing assistant. Continue the user's text naturally and professionally." 
        },
        { 
          role: "user", 
          content: `Context: ${context || 'Blog post'}\n\nContinue: "${prompt}"` 
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
      stream: true,
    });

    // Server-Sent Events 스트림 생성
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Streaming AI 에러:', error);
    return NextResponse.json(
      { error: '스트리밍 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}