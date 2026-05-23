import { NextResponse } from 'next/server';
import { deleteQuestion } from '@/lib/db/questions';
import { requireProjectAccess } from '@/lib/auth';

// 删除单个问题
export async function DELETE(request, { params }) {
  try {
    const { projectId, questionId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'editor');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // 删除问题
    await deleteQuestion(questionId);

    return NextResponse.json({ success: true, message: 'Delete successful' });
  } catch (error) {
    console.error('Delete failed:', String(error));
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
