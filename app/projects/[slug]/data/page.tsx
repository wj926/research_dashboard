import { getReleasesByProject } from '@/lib/queries';
import { loadProject } from '@/lib/mock/loaders';
import { ProjectReleasesView } from '@/components/project/ProjectReleasesView';

export default async function DataTab({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await loadProject(params);
  const releases = (await getReleasesByProject(slug)).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return <ProjectReleasesView projectSlug={slug} releases={releases} />;
}
