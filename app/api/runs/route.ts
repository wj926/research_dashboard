import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireMemberFromBearer } from '@/lib/api/bearer';
import { apiError } from '@/lib/api/errors';
import { logActivity } from '@/lib/actions/events';
import { runStatusToEventAction } from '@/lib/events';
import type { RunStatus } from '@/lib/types';

const STATUSES: readonly RunStatus[] = ['success', 'failure', 'in_progress', 'queued', 'cancelled'];

export async function POST(req: NextRequest) {
  const auth = await requireMemberFromBearer(req);
  if (!auth.ok) return apiError(auth.status, auth.code);

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        projectSlug?: string;
        status?: string;
        summary?: string | null;
        durationSec?: number | null;
      }
    | null;
  if (!body) return apiError(400, 'invalid_request', 'JSON body required');

  const name = body.name?.trim();
  const projectSlug = body.projectSlug?.trim();
  const status = body.status?.trim() as RunStatus | undefined;
  if (!name) return apiError(400, 'invalid_request', 'name is required');
  if (!projectSlug) return apiError(400, 'invalid_request', 'projectSlug is required');
  if (!status || !STATUSES.includes(status)) {
    return apiError(400, 'invalid_request', `status must be one of ${STATUSES.join(', ')}`);
  }

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return apiError(
      404,
      'project_not_found',
      `Project '${projectSlug}' not found in LabHub. Create it via UI first or pass --project=<existing-slug>.`,
    );
  }

  const baseId = `exp-${Math.floor(Date.now() / 1000).toString(36)}`;
  const collision = await prisma.experimentRun.findUnique({ where: { id: baseId } });
  const id = collision ? `${baseId}-${randomUUID().slice(0, 4)}` : baseId;

  await prisma.experimentRun.create({
    data: {
      id,
      name,
      projectSlug,
      status,
      startedAt: new Date(),
      durationSec: body.durationSec ?? null,
      triggeredByLogin: auth.memberLogin,
      summary: body.summary ?? null,
    },
  });

  await logActivity({
    type: 'experiment',
    actorLogin: auth.memberLogin,
    projectSlug,
    payload: { runId: id, action: runStatusToEventAction(status) },
  });

  revalidatePath('/experiments');
  revalidatePath(`/projects/${projectSlug}/experiments`);
  revalidatePath('/');

  return NextResponse.json({ id }, { status: 201 });
}
