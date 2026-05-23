import { clearTokenCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearTokenCookie(response);
  return response;
}
