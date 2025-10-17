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

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 맞춤법 검사 전용 프롬프트
    const spellCheckPrompt = `
당신은 한국어 맞춤법 검사 전문가입니다.
다음 텍스트에서 맞춤법, 띄어쓰기, 문법 오류를 찾아주세요.

검사 규칙:
- 명확한 맞춤법 오류만 지적 (의심스러운 것은 제외)
- 띄어쓰기 오류 찾기
- 문법적으로 잘못된 표현 찾기
- 내용 추가나 변경 절대 금지
- 오류가 없으면 빈 배열 반환

응답 형식:
반드시 JSON 배열 형태로만 응답하고, 다른 텍스트는 포함하지 마세요.

[
  {
    "original": "틀린 단어나 구문",
    "suggestion": "올바른 수정안",
    "type": "spelling|spacing|grammar"
  }
]

검사할 텍스트:
${content}
`;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3, // 낮은 temperature로 정확도 향상
        topP: 0.8,
      }
    });

    const result = await model.generateContent(spellCheckPrompt);
    const response = await result.response;
    let spellCheckResult = response.text().trim();

    // 마크다운 코드 블록 제거
    spellCheckResult = spellCheckResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    return NextResponse.json({
      success: true,
      result: spellCheckResult,
      original: content
    });

  } catch (error) {
    console.error('맞춤법 검사 에러:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: '맞춤법 검사 서비스 오류가 발생했습니다.',
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
