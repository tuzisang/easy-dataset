import { NextResponse } from 'next/server';
import { getImageDatasetsForExport } from '@/lib/db/imageDatasets';
import { requireProjectAccess } from '@/lib/auth';

/**
 * 导出图像数据集
 */
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'editor');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });
    const body = await request.json();

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    const confirmedOnly = body.confirmedOnly || false;

    // 获取数据集
    const datasets = await getImageDatasetsForExport(projectId, confirmedOnly);

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('Failed to export image datasets:', String(error));
    return NextResponse.json(
      {
        error: error.message || 'Failed to export image datasets'
      },
      { status: 500 }
    );
  }
}
