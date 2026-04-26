import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireMemberFromBearer } from '@/lib/api/bearer';
import { apiError } from '@/lib/api/errors';

export async function GET(req: NextRequest) {
  const auth = await requireMemberFromBearer(req);
  if (!auth.ok) return apiError(auth.status, auth.code);

  const m = await prisma.member.findUnique({
    where: { login: auth.memberLogin },
    select: { login: true, displayName: true, role: true },
  });
  if (!m) return apiError(401, 'unknown_member');

  return NextResponse.json({ login: m.login, displayName: m.displayName, role: m.role });
}
