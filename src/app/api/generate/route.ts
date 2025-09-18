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

    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Gemini 프롬프트 구성
    const fullPrompt = `
당신은 금융 시장과 투자 전문 블로그 작성 어시스턴트입니다.
사용자가 작성 중인 블로그 포스트를 자연스럽게 이어서 작성해주세요.

핵심 가이드라인:
- 한국어 콘텐츠는 한국어로, 영어 콘텐츠는 영어로 작성
- 전문적이면서도 접근하기 쉬운 톤 유지
- 독자에게 가치 있는 통찰과 실용적인 정보 제공
- 적절한 금융 용어 사용하되 쉽게 설명
- 구체적인 투자 추천은 피하고 분석적 관점 유지

문단 구성 규칙:
- 내용이 길 경우 논리적으로 문단을 나누어 작성
- 각 문단은 하나의 핵심 아이디어를 담을 것
- 문단 간 자연스러운 연결과 흐름 유지
- HTML <p> 태그로 문단 구분 (긴 내용일 경우 필수)
- 읽기 쉽도록 적절한 문장 길이와 구성

현재 맥락: ${context || '금융 시장에 관한 블로그 포스트'}

이어서 작성할 텍스트: "${prompt}"

위 텍스트에서 자연스럽게 이어지는 고품질 내용을 작성해주세요.
- 기존 텍스트의 문체와 톤을 정확히 유지
- 독자에게 실질적 도움이 되는 인사이트 포함
- 내용이 길어질 경우 논리적 문단으로 구분
- 전문성과 가독성의 균형 유지
`;

    // Gemini API 호출 (토큰 제한 설정)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000, // 최대 1000토큰 (고품질 장문 생성)
        temperature: 0.7,      // 창의성 조절 (0-1)
        topP: 0.9,            // 다양성 조절 (높은 품질)
      }
    });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedText = response.text();

    return NextResponse.json({
      success: true,
      completion: generatedText
    });

  } catch (error) {
    console.error('AI 생성 에러:', error);

    // Gemini API 에러 처리
    if (error instanceof Error) {
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

