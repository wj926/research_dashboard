import { loadProject } from '@/lib/mock/loaders';
import { getAllMembers } from '@/lib/queries';
import { EntryForm } from '@/components/journal/EntryForm';

export default async function NewEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await loadProject(params);
  const members = await getAllMembers();
  return <EntryForm projectSlug={slug} mode="create" members={members} />;
}
