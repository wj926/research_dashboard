import { notFound } from 'next/navigation';
import { getRunById } from '@/lib/queries';
import { RunEditForm } from '@/components/runs/RunEditForm';

export default async function EditRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRunById(id);
  if (!run) notFound();

  return <RunEditForm run={run} />;
}
