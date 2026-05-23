import { createUser, getUserByUsername, signupSchema } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    await createUser(username, password, 'member');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
