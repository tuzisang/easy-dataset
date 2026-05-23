import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireProjectAccess } from '@/lib/auth';

/**
 * 获取项目的所有蒸馏标签
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

    // 获取所有标签
    const tags = await db.tags.findMany({
      where: {
        projectId
      },
      orderBy: {
        label: 'asc'
      }
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('获取蒸馏标签失败:', String(error));
    return NextResponse.json({ error: error.message || '获取蒸馏标签失败' }, { status: 500 });
  }
}
