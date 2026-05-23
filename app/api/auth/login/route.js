import { signToken, setTokenCookie, getUserByUsername, loginSchema } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await signToken(user.id, user.role);
    const response = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role }
    });
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
