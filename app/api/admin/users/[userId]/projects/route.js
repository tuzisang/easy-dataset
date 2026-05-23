import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const projectAccessSchema = z.object({
  items: z.array(
    z.object({
      projectId: z.string().min(1),
      role: z.enum(['owner', 'editor', 'viewer'])
    })
  )
});

// GET — list all projects with target user's access status
export async function GET(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = params;

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [allProjects, userAccess] = await Promise.all([
      db.projects.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      db.projectAccess.findMany({
        where: { userId },
        select: { projectId: true, role: true }
      })
    ]);

    const accessMap = Object.fromEntries(userAccess.map(a => [a.projectId, a.role]));

    return NextResponse.json({
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        role: accessMap[p.id] || null
      }))
    });
  } catch (error) {
    console.error('Failed to list user projects:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — batch update target user's project access
export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = params;

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = projectAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { items } = parsed.data;

    // Validate project IDs exist
    if (items.length > 0) {
      const existingCount = await db.projects.count({
        where: { id: { in: items.map(i => i.projectId) } }
      });
      if (existingCount !== items.length) {
        return NextResponse.json({ error: 'One or more projects not found' }, { status: 400 });
      }
    }

    // Atomic delete + create in a transaction
    await db.$transaction([
      db.projectAccess.deleteMany({ where: { userId } }),
      ...(items.length > 0
        ? [
            db.projectAccess.createMany({
              data: items.map(({ projectId, role }) => ({ userId, projectId, role }))
            })
          ]
        : [])
    ]);

    // Return updated list
    const updatedAccess = await db.projectAccess.findMany({
      where: { userId },
      select: { projectId: true, role: true }
    });
    const accessMap = Object.fromEntries(updatedAccess.map(a => [a.projectId, a.role]));

    const allProjects = await db.projects.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        role: accessMap[p.id] || null
      }))
    });
  } catch (error) {
    console.error('Failed to update user projects:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
