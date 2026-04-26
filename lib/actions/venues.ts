'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import type { VenueKind } from '@/lib/types';

const KINDS: readonly VenueKind[] = ['abstract', 'full', 'camera_ready', 'rebuttal'];

export type CreateVenueState = { error?: string } | null;

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/pipeline');
}

export async function createVenueAction(
  _prev: CreateVenueState,
  formData: FormData,
): Promise<CreateVenueState> {
  const name = String(formData.get('name') ?? '').trim();
  const deadlineStr = String(formData.get('deadline') ?? '').trim();
  const kind = String(formData.get('kind') ?? '').trim() as VenueKind;

  if (!name) return { error: 'Name is required.' };
  if (!deadlineStr) return { error: 'Deadline is required.' };
  if (!KINDS.includes(kind)) return { error: `Invalid kind "${kind}".` };

  const parsed = new Date(deadlineStr);
  if (Number.isNaN(parsed.getTime())) return { error: `Invalid deadline "${deadlineStr}".` };

  await prisma.venue.create({
    data: {
      id: `v-${randomUUID().slice(0, 8)}`,
      name,
      deadline: parsed,
      kind,
    },
  });
  revalidateAll();
  return null;
}

export async function updateVenueAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const deadlineStr = String(formData.get('deadline') ?? '').trim();
  const kind = String(formData.get('kind') ?? '').trim() as VenueKind;

  if (!name) throw new Error('Name is required');
  if (!deadlineStr) throw new Error('Deadline is required');
  if (!KINDS.includes(kind)) throw new Error(`Invalid kind "${kind}"`);

  const parsed = new Date(deadlineStr);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid deadline "${deadlineStr}"`);

  await prisma.venue.update({
    where: { id },
    data: { name, deadline: parsed, kind },
  });
  revalidateAll();
}

export async function deleteVenueAction(id: string): Promise<void> {
  await prisma.venue.delete({ where: { id } });
  revalidateAll();
}
