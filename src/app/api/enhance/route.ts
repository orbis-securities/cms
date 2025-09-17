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

    const { content, command, context } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Gemini 본문 보강 프롬프트 구성
    const fullPrompt = `
당신은 금융 시장과 투자 전문 블로그 작성 전문가입니다.
사용자가 작성한 블로그 본문을 분석하여 더욱 풍성하고 전문적으로 보강해주세요.

본문 보강 가이드라인:
- 기존 내용의 핵심 메시지와 구조는 완전히 보존
- 부족한 부분에 전문적인 분석이나 인사이트 추가
- 독자 이해를 돕는 구체적인 예시나 데이터 보완
- 논리적 흐름과 문단 구성 개선
- 전문 용어 사용 시 쉬운 부연 설명 추가
- 결론이나 요약 부분 강화 (필요시)
- HTML 태그로 적절한 문단 구분과 강조

보강 방식:
- 기존 텍스트를 수정하지 말고 보완/확장
- 새로운 문단이나 문장을 자연스럽게 추가
- 독자에게 실질적 가치를 제공하는 내용으로
- 전문성과 가독성의 균형 유지
- 과도한 내용 추가는 피하고 적절한 분량으로

맥락 정보: ${context || '금융 투자 전문 블로그'}

현재 본문:
${content}

사용자 요청사항:
"${command || '전체적으로 보강해주세요'}"

위 본문을 사용자 요청에 따라 개선해주세요.
- 기존 내용의 핵심은 반드시 보존
- 사용자 요청사항을 정확히 반영
- 객관적이고 전문적인 관점으로 보강
- 개인적 의견이나 추측은 절대 추가하지 마세요
- 기존 글의 톤과 스타일을 완전히 유지
`;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2000, // 본문 보강은 더 많은 토큰
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let enhancedContent = response.text().trim();

    // 코드 블록 마크다운 제거
    enhancedContent = enhancedContent.replace(/```html\s*/g, '').replace(/```\s*/g, '');

    return NextResponse.json({
      success: true,
      enhanced: enhancedContent,
      original: content
    });

  } catch (error) {
    console.error('AI 본문 보강 에러:', error);

    // Gemini API 에러 처리
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'AI 본문 보강 서비스 오류가 발생했습니다.',
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