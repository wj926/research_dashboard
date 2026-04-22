import type { Member } from '@/lib/types';

export const members: Member[] = [
  { login: 'sooyoung', displayName: 'Prof. Kim Soo-young', role: 'PI', bio: 'LLM reasoning, alignment, evaluation.', pinnedProjectSlugs: ['reasoning-bench-v2', 'alignment-probes'] },
  { login: 'haneul', displayName: 'Dr. Park Ha-neul', role: 'Postdoc', bio: 'Long-context models and retrieval.', pinnedProjectSlugs: ['long-context-eval'] },
  { login: 'yeji', displayName: 'Dr. Lee Ye-ji', role: 'Postdoc', bio: 'Agentic tool use, code generation.', pinnedProjectSlugs: ['agentic-tool-use', 'claude-skill-suite'] },
  { login: 'dgu', displayName: 'Dongyu', role: 'PhD', bio: 'Claude Code skills, research tooling.', pinnedProjectSlugs: ['claude-skill-suite'] },
  { login: 'jihoon', displayName: 'Jihoon', role: 'PhD', bio: 'Reasoning depth benchmarks.', pinnedProjectSlugs: ['reasoning-bench-v2'] },
  { login: 'minji', displayName: 'Minji', role: 'PhD', bio: 'Context-length evaluation.', pinnedProjectSlugs: ['long-context-eval'] },
  { login: 'sungmin', displayName: 'Sungmin', role: 'PhD', bio: 'Alignment failure modes.', pinnedProjectSlugs: ['alignment-probes'] },
  { login: 'jiwoo', displayName: 'Jiwoo', role: 'PhD', bio: 'Korean reasoning datasets.', pinnedProjectSlugs: ['KoLogicQA'] },
  { login: 'taehyun', displayName: 'Taehyun', role: 'PhD', bio: 'Agentic evaluation environments.', pinnedProjectSlugs: ['agentic-tool-use'] },
  { login: 'nari', displayName: 'Nari', role: 'MS', bio: 'Dataset pipelines.', pinnedProjectSlugs: ['KoLogicQA'] },
  { login: 'junho', displayName: 'Junho', role: 'MS', bio: 'Eval infrastructure.', pinnedProjectSlugs: ['reasoning-bench-v2'] },
  { login: 'eunseo', displayName: 'Eunseo', role: 'Intern', bio: 'Summer intern — tool use.', pinnedProjectSlugs: ['agentic-tool-use'] },
];
