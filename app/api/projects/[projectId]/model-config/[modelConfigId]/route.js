import { NextResponse } from 'next/server';
import { deleteModelConfigById } from '@/lib/db/model-config';
import { requireProjectAccess } from '@/lib/auth';

// 删除模型配置
export async function DELETE(request, { params }) {
  try {
    const { projectId, modelConfigId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'editor');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });
    // 验证项目 ID
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }
    await deleteModelConfigById(modelConfigId);
    return NextResponse.json(true);
  } catch (error) {
    console.error('Error obtaining model configuration:', String(error));
    return NextResponse.json({ error: 'Failed to obtain model configuration' }, { status: 500 });
  }
}
