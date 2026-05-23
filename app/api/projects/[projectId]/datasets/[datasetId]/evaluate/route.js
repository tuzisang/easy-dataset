import { NextResponse } from 'next/server';
import { evaluateDataset } from '@/lib/services/datasets/evaluation';
import { requireProjectAccess } from '@/lib/auth';

/**
 * 评估单个数据集的质量
 */
export async function POST(request, { params }) {
  try {
    const { projectId, datasetId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'editor');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });
    const { model, language = 'zh-CN' } = await request.json();

    if (!projectId || !datasetId) {
      return NextResponse.json({ success: false, message: '项目ID和数据集ID不能为空' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ success: false, message: '模型配置不能为空' }, { status: 400 });
    }

    // 使用评估服务进行数据集评估
    const result = await evaluateDataset(projectId, datasetId, model, language);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '数据集评估完成',
      data: result.data
    });
  } catch (error) {
    console.error('数据集评估失败:', error);
    return NextResponse.json({ success: false, message: `评估失败: ${error.message}` }, { status: 500 });
  }
}
