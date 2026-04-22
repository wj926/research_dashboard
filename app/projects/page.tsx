import { ProjectCard } from '@/components/project/ProjectCard';
import { projects } from '@/lib/mock';

export default function ProjectsIndex() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(p => <ProjectCard key={p.slug} project={p} />)}
      </div>
    </div>
  );
}
