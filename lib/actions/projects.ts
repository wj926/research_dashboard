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

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export async function createProject(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '');
  const pinned = formData.get('pinned') === 'on';
  const slugRaw = String(formData.get('slug') ?? '').trim().toLowerCase();

  if (!name) throw new Error('Name is required');
  if (!description) throw new Error('Description is required');

  // Prefer explicit slug if provided; otherwise derive from name.
  const slug = slugRaw || slugify(name);
  if (!slug) {
    throw new Error(
      'Please fill the Slug field. The Name contains no ASCII letters or digits, so a URL slug could not be derived automatically. Example: "my-new-project".'
    );
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Slug "${slug}" is invalid. Use lowercase letters, digits, and hyphens only (e.g., "reasoning-bench-v3").`
    );
  }

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
