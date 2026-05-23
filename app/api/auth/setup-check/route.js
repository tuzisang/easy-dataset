import { getUserCount } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const count = await getUserCount();
  return NextResponse.json({ needsSetup: count === 0 });
}
