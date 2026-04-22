'use server';

import { revalidatePath } from 'next/cache';
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
