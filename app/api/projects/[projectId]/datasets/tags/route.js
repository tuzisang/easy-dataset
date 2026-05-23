import { NextResponse } from 'next/server';
import { getUsedCustomTags } from '@/lib/db/datasets';
import { requireProjectAccess } from '@/lib/auth';

/**
 * 获取项目中使用过的自定义标签
 */
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'viewer');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    const tags = await getUsedCustomTags(projectId);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('获取自定义标签失败:', String(error));
    return NextResponse.json(
      {
        error: error.message || '获取自定义标签失败'
      },
      { status: 500 }
    );
  }
}
