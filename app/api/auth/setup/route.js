import { createUser, signToken, setTokenCookie, getUserCount, signupSchema } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Only allow setup when no users exist
    const count = await getUserCount();
    if (count > 0) {
      return NextResponse.json({ error: 'System already initialized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const user = await createUser(username, password, 'admin');

    const token = await signToken(user.id, user.role);
    const response = NextResponse.json({ user }, { status: 201 });
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Setup error:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
