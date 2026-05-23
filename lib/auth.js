import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/jwt-secret';

const TOKEN_EXPIRATION = '24h';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Username must be alphanumeric with underscores and hyphens'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters')
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['editor', 'viewer'])
});

export const updateMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['owner', 'editor', 'viewer'])
});

export const deleteMemberSchema = z.object({
  userId: z.string().min(1)
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'member'])
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1)
});

// ─── Password Helpers ───────────────────────────────────────────────────────

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── JWT Helpers ────────────────────────────────────────────────────────────

export async function signToken(userId, role) {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRATION)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// ─── Auth Cookie ────────────────────────────────────────────────────────────

export function setTokenCookie(response, token) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

export function clearTokenCookie(response) {
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

// ─── User Helpers ───────────────────────────────────────────────────────────

export async function getUserById(userId) {
  try {
    return await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, createAt: true }
    });
  } catch {
    return null;
  }
}

export async function getUserByUsername(username) {
  try {
    return await db.user.findUnique({
      where: { username },
      select: { id: true, username: true, role: true, password: true, createAt: true }
    });
  } catch {
    return null;
  }
}

export async function createUser(username, password, role = 'member') {
  const hashedPassword = await hashPassword(password);
  return db.user.create({
    data: { username, password: hashedPassword, role },
    select: { id: true, username: true, role: true, createAt: true }
  });
}

export async function getUserCount() {
  try {
    return await db.user.count();
  } catch {
    return 0;
  }
}

// ─── Project Access Helpers ─────────────────────────────────────────────────

const ROLE_HIERARCHY = { viewer: 1, editor: 2, owner: 3 };

export async function checkProjectAccess(userId, projectId, minRole = 'viewer') {
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return false;

    // Admin has access to all projects
    if (user.role === 'admin') return true;

    const access = await db.projectAccess.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });
    if (!access) return false;

    return ROLE_HIERARCHY[access.role] >= ROLE_HIERARCHY[minRole];
  } catch {
    return false;
  }
}

export async function requireProjectAccess(request, projectId, minRole = 'viewer') {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  const hasAccess = await checkProjectAccess(userId, projectId, minRole);
  if (!hasAccess) {
    return { error: 'Forbidden', status: 403 };
  }

  return null;
}

export async function requireAdmin(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return false;
  const user = await getUserById(userId);
  return user && user.role === 'admin';
}

// ─── Request Helpers ────────────────────────────────────────────────────────

export function getUserId(request) {
  return request.headers.get('x-user-id') || null;
}

export function getUserRole(request) {
  return request.headers.get('x-user-role') || null;
}
