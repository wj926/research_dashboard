'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CURRENT_USER } from '@/lib/queries/constants';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createProject(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '');
  const pinned = formData.get('pinned') === 'on';

  if (!name) throw new Error('Name is required');
  if (!description) throw new Error('Description is required');

  const slug = slugify(name);
  if (!slug) throw new Error('Name must contain letters or digits');

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) throw new Error(`A project with slug "${slug}" already exists`);

  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const now = new Date();

  await prisma.project.create({
    data: {
      slug,
      name,
      description,
      tags: JSON.stringify(tags),
      pinned,
      createdAt: now,
      updatedAt: now,
      members: {
        create: [{ memberLogin: CURRENT_USER }],
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/projects');
  redirect(`/projects/${slug}`);
}
