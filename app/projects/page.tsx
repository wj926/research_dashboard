import { ProjectCard } from '@/components/project/ProjectCard';
import { getAllProjects } from '@/lib/queries';

export default async function ProjectsIndex() {
  const projects = await getAllProjects();
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(p => <ProjectCard key={p.slug} project={p} />)}
      </div>
    </div>
  );
}
