import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getImageDetailWithQuestions } from '@/lib/services/images';
import { requireProjectAccess } from '@/lib/auth';

const prisma = new PrismaClient();

// 获取下一个有未标注问题的图片
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'viewer');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    // 查找第一个有未标注问题的图片
    const unansweredQuestion = await prisma.questions.findFirst({
      where: {
        projectId,
        imageId: {
          not: null
        },
        answered: false
      }
    });

    if (!unansweredQuestion) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    // 调用服务层获取图片详情
    const imageData = await getImageDetailWithQuestions(projectId, unansweredQuestion.imageId);

    return NextResponse.json({
      success: true,
      data: imageData
    });
  } catch (error) {
    console.error('Failed to get next unanswered image:', error);
    return NextResponse.json({ error: error.message || 'Failed to get next unanswered image' }, { status: 500 });
  }
}
