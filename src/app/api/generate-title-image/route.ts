import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key-for-build');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 503 }
      );
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 503 }
      );
    }

    const { title, content } = await request.json();

    if (!content || content === '<p></p>') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('🎨 AI 타이틀 이미지 생성 시작...');

    // Step 1: Gemini로 이미지 프롬프트 생성
    const promptGenerationPrompt = `
당신은 블로그 포스트의 타이틀 이미지를 위한 AI 이미지 생성 프롬프트를 작성하는 전문가입니다.

주어진 블로그 내용을 분석하여 DALL-E로 생성할 이미지 프롬프트를 영어로 작성해주세요.

요구사항:
- 블로그 포스트의 핵심 주제를 시각적으로 표현
- 전문적이고 고품질의 이미지 스타일
- 깔끔하고 모던한 디자인
- 텍스트가 없는 순수 이미지만
- 1-2문장의 간결한 영어 프롬프트

블로그 제목: ${title || '제목 없음'}

블로그 내용:
${content.replace(/<[^>]*>/g, '').substring(0, 2000)}

위 내용을 바탕으로 DALL-E 이미지 생성 프롬프트를 영어로 1-2문장으로 작성해주세요.
프롬프트만 출력하고 다른 설명은 하지 마세요.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    console.log('🤖 Gemini로 이미지 프롬프트 생성 중...');
    const result = await model.generateContent(promptGenerationPrompt);
    const response = await result.response;
    const imagePrompt = response.text().trim();

    console.log('📝 생성된 이미지 프롬프트:', imagePrompt);

    // Step 2: OpenAI DALL-E로 이미지 생성
    console.log('🎨 DALL-E로 이미지 생성 중...');
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional blog header image: ${imagePrompt}. Clean, modern, minimalist style. High quality, visually appealing.`,
      n: 1,
      size: "1792x1024", // 블로그 타이틀 이미지에 적합한 와이드 사이즈
      quality: "standard",
      style: "vivid",
    });

    const generatedImageUrl = imageResponse.data[0]?.url;

    if (!generatedImageUrl) {
      throw new Error('이미지 생성에 실패했습니다.');
    }

    console.log('✅ 이미지 생성 완료:', generatedImageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      prompt: imagePrompt,
    });

  } catch (error) {
    console.error('❌ AI 타이틀 이미지 생성 에러:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'AI 타이틀 이미지 생성 중 오류가 발생했습니다.',
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
