import { getPapersByProject, getAllMembers } from '@/lib/queries';
import { loadProject } from '@/lib/mock/loaders';
import { ProjectPapersView } from '@/components/project/ProjectPapersView';

export default async function PapersTab({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug, project } = await loadProject(params);
  const [papers, members] = await Promise.all([
    getPapersByProject(slug),
    getAllMembers(),
  ]);

  return (
    <ProjectPapersView
      projectSlug={slug}
      projectName={project.name}
      projectDescription={project.description}
      papers={papers}
      members={members}
    />
  );
}
