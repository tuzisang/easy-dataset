import { db } from '@/lib/db';
import { getUserById, getUserRole, updateUserRoleSchema, deleteUserSchema } from '@/lib/auth';
import { NextResponse } from 'next/server';

async function requireAdmin(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return false;
  const user = await getUserById(userId);
  return user && user.role === 'admin';
}

// GET — list all users with project counts (admin only)
export async function GET(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createAt: true,
        _count: { select: { projectAccess: true } }
      },
      orderBy: { createAt: 'desc' }
    });

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createAt: u.createAt,
        projectCount: u._count.projectAccess
      }))
    });
  } catch (error) {
    console.error('Failed to list users:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — update user role (admin only)
export async function PUT(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, role: newRole } = parsed.data;

    const updated = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, username: true, role: true }
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Failed to update user:', String(error));
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}

// DELETE — delete user (admin only, cannot delete self)
export async function DELETE(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const userId = request.headers.get('x-user-id');
    if (parsed.data.userId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await db.user.delete({ where: { id: parsed.data.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', String(error));
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}
