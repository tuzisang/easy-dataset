import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProjectRoot } from '@/lib/db/base';
import { requireProjectAccess } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    const authErr = await requireProjectAccess(request, projectId, 'viewer');
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const configPath = path.join(projectPath, 'dataset_info.json');

    const exists = fs.existsSync(configPath);

    return NextResponse.json({
      exists,
      configPath: exists ? configPath : null
    });
  } catch (error) {
    console.error('Error checking Llama Factory config:', String(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
