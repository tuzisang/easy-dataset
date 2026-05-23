import { db } from '@/lib/db';
import { requireProjectAccess, createMemberSchema, updateMemberSchema, deleteMemberSchema } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET — list all members of a project
export async function GET(request, { params }) {
  const { projectId } = params;

  const authErr = await requireProjectAccess(request, projectId, 'viewer');
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  try {
    const members = await db.projectAccess.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, username: true } }
      },
      orderBy: { createAt: 'asc' }
    });

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        username: m.user.username,
        role: m.role,
        createAt: m.createAt
      }))
    });
  } catch (error) {
    console.error('Failed to list members:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — add a member (owner only)
export async function POST(request, { params }) {
  const { projectId } = params;

  const authErr = await requireProjectAccess(request, projectId, 'owner');
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  try {
    const body = await request.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, role } = parsed.data;

    // Check if already a member
    const existing = await db.projectAccess.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });
    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
    }

    const member = await db.projectAccess.create({
      data: { userId, projectId, role },
      include: { user: { select: { id: true, username: true } } }
    });

    return NextResponse.json(
      {
        member: {
          id: member.id,
          userId: member.userId,
          username: member.user.username,
          role: member.role,
          createAt: member.createAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to add member:', String(error));
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

// PUT — change member role (owner only)
export async function PUT(request, { params }) {
  const { projectId } = params;

  const authErr = await requireProjectAccess(request, projectId, 'owner');
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  try {
    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, role } = parsed.data;

    // Prevent demoting the last owner
    if (role !== 'owner') {
      const targetMember = await db.projectAccess.findUnique({
        where: { userId_projectId: { userId, projectId } }
      });
      if (targetMember && targetMember.role === 'owner') {
        const ownerCount = await db.projectAccess.count({
          where: { projectId, role: 'owner' }
        });
        if (ownerCount <= 1) {
          return NextResponse.json({ error: 'Project must have at least one owner' }, { status: 400 });
        }
      }
    }

    const updated = await db.projectAccess.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: { user: { select: { id: true, username: true } } }
    });

    return NextResponse.json({
      member: {
        id: updated.id,
        userId: updated.userId,
        username: updated.user.username,
        role: updated.role
      }
    });
  } catch (error) {
    console.error('Failed to update member:', String(error));
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
}

// DELETE — remove a member (owner only, cannot remove last owner)
export async function DELETE(request, { params }) {
  const { projectId } = params;

  const authErr = await requireProjectAccess(request, projectId, 'owner');
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  try {
    const body = await request.json();
    const parsed = deleteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId } = parsed.data;

    // Check if this is the last owner
    const memberToRemove = await db.projectAccess.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });
    if (memberToRemove && memberToRemove.role === 'owner') {
      const ownerCount = await db.projectAccess.count({
        where: { projectId, role: 'owner' }
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'Project must have at least one owner' }, { status: 400 });
      }
    }

    await db.projectAccess.delete({
      where: { userId_projectId: { userId, projectId } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove member:', String(error));
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
}
