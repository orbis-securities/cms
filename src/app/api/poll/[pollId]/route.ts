import { NextRequest, NextResponse } from 'next/server';

// POST: 투표 제출 (API 미구현)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Poll API is not implemented yet. Please migrate to Supabase API.',
    },
    { status: 501 }
  );
}
