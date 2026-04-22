'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { PAPER_STAGE_ORDER } from '@/lib/labels';
import type { PaperStage } from '@/lib/types';

export async function updatePaperStage(paperId: string, stage: PaperStage): Promise<void> {
  if (!PAPER_STAGE_ORDER.includes(stage)) throw new Error(`Invalid stage ${stage}`);
  await prisma.paper.update({
    where: { id: paperId },
    data: { stage },
  });
  revalidatePath('/pipeline');
  revalidatePath('/projects');
}

export async function createPaper(projectSlug: string, formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  const stage = String(formData.get('stage') ?? '') as PaperStage;
  const venue = String(formData.get('venue') ?? '').trim() || null;
  const deadlineStr = String(formData.get('deadline') ?? '').trim();
  const authorsRaw = formData.getAll('authors');
  const draftUrl = String(formData.get('draftUrl') ?? '').trim() || null;

  if (!title) throw new Error('Title is required');
  if (!PAPER_STAGE_ORDER.includes(stage)) throw new Error(`Invalid stage "${stage}"`);

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) throw new Error(`Project "${projectSlug}" not found`);

  const authors = authorsRaw.map(String).filter(Boolean);
  if (authors.length === 0) throw new Error('At least one author is required');

  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  const id = `p-${randomUUID().slice(0, 8)}`;

  await prisma.paper.create({
    data: {
      id,
      title,
      projectSlug,
      stage,
      venue,
      deadline,
      draftUrl,
      authors: {
        create: authors.map((login, position) => ({
          authorLogin: login,
          position,
        })),
      },
    },
  });

  revalidatePath(`/projects/${projectSlug}/papers`);
  revalidatePath('/pipeline');
  revalidatePath('/');
  redirect(`/projects/${projectSlug}/papers`);
}
