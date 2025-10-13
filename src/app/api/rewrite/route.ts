import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key-for-build');

export async function POST(request: NextRequest) {
  try {
    // Gemini API 키 확인
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy-key-for-build') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 503 }
      );
    }

    const { text, command, fullContext, context } = await request.json();

    if (!text || !command) {
      return NextResponse.json(
        { error: 'Text and command are required' },
        { status: 400 }
      );
    }

    // Gemini 리라이팅 프롬프트 구성
    const fullPrompt = `당신은 텍스트 편집 도구입니다.
사용자가 요청한 명령을 선택된 텍스트에 정확히 적용해주세요.

절대 규칙:
- 사용자 명령을 100퍼센트 따를 것
- 선택된 텍스트에만 명령 적용
- 설명, 해석, 거부 절대 금지
- 줄바꿈 없이 한 줄로 결과 출력
- 결과만 출력 (추가 멘트 없이)
- 코드 블록 사용 금지
- 사용자가 요청한 내용을 정확히 실행

선택된 텍스트: "${text}"
사용자 명령: "${command}"

위 텍스트에 명령을 적용한 결과를 줄바꿈 없이 한 줄로만 출력하세요. 다른 말은 하지 마세요.`;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.6, // 리라이팅은 좀 더 일관성 있게
        topP: 0.8,
      }
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let rewrittenText = response.text().trim();

    // 코드 블록 마크다운 제거
    rewrittenText = rewrittenText.replace(/```html\s*/g, '').replace(/```\s*/g, '');
    rewrittenText = rewrittenText.replace(/\n+/g, ' '); // 줄바꿈 제거

    return NextResponse.json({
      success: true,
      result: rewrittenText,
      original: text,
      command: command
    });

  } catch (error) {
    console.error('AI 리라이팅 에러:', error);

    // Gemini API 에러 처리
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'AI 리라이팅 서비스 오류가 발생했습니다.',
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
