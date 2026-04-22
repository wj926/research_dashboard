import { notFound } from 'next/navigation';
import { getAllMembers, getPaperById, getProjectBySlug } from '@/lib/queries';
import { PaperEditForm } from '@/components/project/PaperEditForm';

export default async function EditPaperPage({
  params,
}: {
  params: Promise<{ slug: string; paperId: string }>;
}) {
  const { slug, paperId } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [paper, members] = await Promise.all([
    getPaperById(paperId),
    getAllMembers(),
  ]);
  if (!paper || paper.projectSlug !== slug) notFound();

  return <PaperEditForm paper={paper} members={members} />;
}
