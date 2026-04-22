import { notFound } from 'next/navigation';
import { getAllMembers, getEntryById, getProjectBySlug } from '@/lib/queries';
import { EntryForm } from '@/components/journal/EntryForm';

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ slug: string; entryId: string }>;
}) {
  const { slug, entryId } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [entry, members] = await Promise.all([
    getEntryById(entryId),
    getAllMembers(),
  ]);
  if (!entry || entry.projectSlug !== slug) notFound();

  return (
    <EntryForm
      projectSlug={slug}
      mode="edit"
      initial={entry}
      members={members}
    />
  );
}
