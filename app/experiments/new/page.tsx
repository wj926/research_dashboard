import { RunCreateForm } from '@/components/runs/RunCreateForm';
import { getAllProjects, getAllMembers } from '@/lib/queries';

export default async function NewRunPage() {
  const [projects, members] = await Promise.all([getAllProjects(), getAllMembers()]);
  return <RunCreateForm projects={projects} members={members} />;
}
