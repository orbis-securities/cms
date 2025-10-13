import { NextRequest, NextResponse } from 'next/server';
import { getPostById, updatePostInFirestore } from '@/lib/firebase/posts';

// POST: 투표 제출 (포스트의 poll 필드 업데이트)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const body = await request.json();
    const { selectedOptions, blogId, postId } = body;

    if (!blogId || !postId) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogId or postId',
      }, { status: 400 });
    }

    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid selectedOptions',
      }, { status: 400 });
    }

    // 포스트 조회
    const post = await getPostById(blogId, postId);

    if (!post || !post.polls || post.polls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No polls found in post',
      }, { status: 404 });
    }

    // polls 배열에서 해당 pollId 찾기
    const pollIndex = post.polls.findIndex(p => p.pollId === pollId);

    if (pollIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Poll not found in post',
      }, { status: 404 });
    }

    const targetPoll = post.polls[pollIndex];

    // 투표 수 증가
    const updatedOptions = targetPoll.options.map((option, index) => {
      if (selectedOptions.includes(index)) {
        return {
          ...option,
          votes: option.votes + 1,
        };
      }
      return option;
    });

    const updatedPoll = {
      ...targetPoll,
      options: updatedOptions,
      totalVotes: targetPoll.totalVotes + 1,
    };

    // polls 배열 업데이트
    const updatedPolls = [...post.polls];
    updatedPolls[pollIndex] = updatedPoll;

    // 포스트의 polls 필드 업데이트
    await updatePostInFirestore(blogId, postId, {
      polls: updatedPolls,
    });

    return NextResponse.json({
      success: true,
      data: updatedPoll,
      message: 'Vote submitted successfully',
    });
  } catch (error) {
    console.error('Poll POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit vote',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
