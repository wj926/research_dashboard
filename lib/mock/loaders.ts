import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/queries';
import type { Project } from '@/lib/types';

export async function loadProject(params: Promise<{ slug: string }>): Promise<{ slug: string; project: Project }> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  return { slug, project };
}
