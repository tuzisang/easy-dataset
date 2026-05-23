import { getUserById } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(userId);
  return NextResponse.json({ user });
}
