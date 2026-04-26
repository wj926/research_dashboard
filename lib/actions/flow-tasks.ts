'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

// All actions take FormData for direct use with <form action={...}>.

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function num(fd: FormData, key: string): number {
  const v = fd.get(key);
  return v == null ? NaN : Number(v);
}

// ---------------------------------------------------------------------
// Tasks (TodoItem) CRUD
// ---------------------------------------------------------------------

export async function createTaskAction(fd: FormData) {
  const projectSlug = str(fd, 'projectSlug');
  const bucket = str(fd, 'bucket');           // 'short' | 'mid' | 'long'
  const title = str(fd, 'title');
  const goal = str(fd, 'goal') || null;
  const subtasksRaw = str(fd, 'subtasks');    // newline-separated
  const status = str(fd, 'status') || 'in_progress';
  const redirectTo = str(fd, 'redirectTo');

  if (!projectSlug || !bucket || !title) return;

  const subtasks = subtasksRaw
    ? JSON.stringify(
        subtasksRaw
          .split(/\r?\n/)
          .map(s => s.trim())
          .filter(Boolean),
      )
    : null;

  const max = await prisma.todoItem.findFirst({
    where: { projectSlug, bucket },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (max?.position ?? -1) + 1;

  await prisma.todoItem.create({
    data: {
      projectSlug,
      bucket,
      text: title,
      goal,
      subtasks,
      status,
      done: status === 'done',
      position,
    },
  });

  revalidatePath(`/projects/${projectSlug}/flow/j`);
  if (redirectTo) redirect(redirectTo);
}

export async function updateTaskAction(fd: FormData) {
  const id = num(fd, 'id');
  const title = str(fd, 'title');
  const goal = str(fd, 'goal') || null;
  const subtasksRaw = str(fd, 'subtasks');
  const status = str(fd, 'status') || 'in_progress';
  const bucket = str(fd, 'bucket');
  const projectSlug = str(fd, 'projectSlug');
  const redirectTo = str(fd, 'redirectTo');

  if (!Number.isFinite(id) || !title) return;

  const subtasks = subtasksRaw
    ? JSON.stringify(
        subtasksRaw
          .split(/\r?\n/)
          .map(s => s.trim())
          .filter(Boolean),
      )
    : null;

  await prisma.todoItem.update({
    where: { id },
    data: {
      text: title,
      goal,
      subtasks,
      status,
      done: status === 'done',
      bucket,
    },
  });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/flow/j`);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteTaskAction(fd: FormData) {
  const id = num(fd, 'id');
  const projectSlug = str(fd, 'projectSlug');
  const redirectTo = str(fd, 'redirectTo');
  if (!Number.isFinite(id)) return;

  await prisma.todoItem.delete({ where: { id } });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/flow/j`);
  if (redirectTo) redirect(redirectTo);
}

export async function setTaskStatusAction(fd: FormData) {
  const id = num(fd, 'id');
  const status = str(fd, 'status');
  const projectSlug = str(fd, 'projectSlug');
  if (!Number.isFinite(id) || !status) return;

  await prisma.todoItem.update({
    where: { id },
    data: { status, done: status === 'done' },
  });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/flow/j`);
}

// ---------------------------------------------------------------------
// Event ↔ Task link CRUD
// ---------------------------------------------------------------------

export async function linkEventToTaskAction(fd: FormData) {
  const projectSlug = str(fd, 'projectSlug');
  const eventSource = str(fd, 'eventSource');
  const todoId = num(fd, 'todoId');
  if (!projectSlug || !eventSource || !Number.isFinite(todoId)) return;

  // Upsert: ignore duplicate (unique constraint on projectSlug+eventSource+todoId)
  try {
    await prisma.flowEventTaskLink.create({
      data: { projectSlug, eventSource, todoId, source: 'manual' },
    });
  } catch {
    // already exists, fine
  }

  revalidatePath(`/projects/${projectSlug}/flow/j`);
}

export async function unlinkEventFromTaskAction(fd: FormData) {
  const projectSlug = str(fd, 'projectSlug');
  const eventSource = str(fd, 'eventSource');
  const todoId = num(fd, 'todoId');
  if (!projectSlug || !eventSource || !Number.isFinite(todoId)) return;

  await prisma.flowEventTaskLink.deleteMany({
    where: { projectSlug, eventSource, todoId },
  });

  revalidatePath(`/projects/${projectSlug}/flow/j`);
}

// ---------------------------------------------------------------------
// Flow events CRUD
// ---------------------------------------------------------------------

function parseLines(raw: string): string[] {
  return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function parseNumbers(raw: string): { label: string; value: string }[] {
  // Format: "label: value" per line
  return parseLines(raw)
    .map(line => {
      const idx = line.indexOf(':');
      if (idx < 0) return null;
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((x): x is { label: string; value: string } => x !== null);
}

export async function updateFlowEventAction(fd: FormData) {
  const id = num(fd, 'id');
  const projectSlug = str(fd, 'projectSlug');
  const date = str(fd, 'date');
  const title = str(fd, 'title');
  const summary = str(fd, 'summary');
  const tone = str(fd, 'tone');
  const bulletsRaw = str(fd, 'bullets');
  const numbersRaw = str(fd, 'numbers');
  const redirectTo = str(fd, 'redirectTo');

  if (!Number.isFinite(id) || !title) return;

  const bullets = bulletsRaw ? JSON.stringify(parseLines(bulletsRaw)) : null;
  const numbers = numbersRaw ? JSON.stringify(parseNumbers(numbersRaw)) : null;

  await prisma.flowEvent.update({
    where: { id },
    data: { date, title, summary, tone, bullets, numbers },
  });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/flow/j`);
  if (redirectTo) redirect(redirectTo);
}

export async function deleteFlowEventAction(fd: FormData) {
  const id = num(fd, 'id');
  const projectSlug = str(fd, 'projectSlug');
  const redirectTo = str(fd, 'redirectTo');
  if (!Number.isFinite(id)) return;

  // Also remove orphan links
  const ev = await prisma.flowEvent.findUnique({ where: { id } });
  if (ev) {
    await prisma.flowEventTaskLink.deleteMany({
      where: { projectSlug: ev.projectSlug, eventSource: ev.source },
    });
  }

  await prisma.flowEvent.delete({ where: { id } });

  if (projectSlug) revalidatePath(`/projects/${projectSlug}/flow/j`);
  if (redirectTo) redirect(redirectTo);
}
