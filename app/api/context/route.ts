import { buildStudentContext } from '@/lib/twin/buildStudentContext';
import { getDemoSession } from '@/lib/demoSession';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = getDemoSession();

  const context = await buildStudentContext(
    session.user.studentId,
    session.user.name ?? '',
    session.user.email ?? '',
    session.user.accessToken
  );

  return NextResponse.json(context);
}
