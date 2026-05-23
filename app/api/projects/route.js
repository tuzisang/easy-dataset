import { createProject, getProjects, isExistByName } from '@/lib/db/projects';
import { createInitModelConfig, getModelConfigByProjectId } from '@/lib/db/model-config';
import { getUserId, requireProjectAccess } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const userId = getUserId(request);
    const projectData = await request.json();
    if (!projectData.name) {
      return Response.json({ error: 'Project name is required' }, { status: 400 });
    }

    if (await isExistByName(projectData.name)) {
      return Response.json({ error: 'Project name already exists' }, { status: 400 });
    }
    const newProject = await createProject(projectData);

    // Grant owner access to the creator
    if (userId && userId !== 'local') {
      await db.projectAccess.create({
        data: { userId, projectId: newProject.id, role: 'owner' }
      });
    }

    if (projectData.reuseConfigFrom) {
      const authErr = await requireProjectAccess(request, projectData.reuseConfigFrom, 'viewer');
      if (authErr) return Response.json({ error: 'Forbidden' }, { status: 403 });

      let data = await getModelConfigByProjectId(projectData.reuseConfigFrom);

      let newData = data.map(item => {
        delete item.id;
        return {
          ...item,
          projectId: newProject.id
        };
      });
      await createInitModelConfig(newData);
    }
    return Response.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const userId = getUserId(request);
    const projects = await getProjects(userId);
    return Response.json(projects);
  } catch (error) {
    console.error('Failed to get project list:', String(error));
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
