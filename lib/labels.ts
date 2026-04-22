import type { PaperStage, DiscussionCategory } from './types';

export const PAPER_STAGE_LABELS: Record<PaperStage, string> = {
  idea: 'Idea',
  experiments: 'Running experiments',
  writing: 'Writing',
  review: 'Under review',
  published: 'Published',
};

export const PAPER_STAGE_ORDER: PaperStage[] = ['idea', 'experiments', 'writing', 'review', 'published'];

export const PAPER_STAGE_TONE: Record<PaperStage, 'neutral' | 'attention' | 'accent' | 'done' | 'success'> = {
  idea: 'neutral',
  experiments: 'attention',
  writing: 'accent',
  review: 'done',
  published: 'success',
};

export const DISCUSSION_CATEGORY_LABELS: Record<DiscussionCategory, string> = {
  announcements: 'Announcements',
  journal_club: 'Journal Club',
  qa: 'Q&A',
  ideas: 'Ideas',
};

export const DISCUSSION_CATEGORY_ICONS: Record<DiscussionCategory, string> = {
  announcements: '📣',
  journal_club: '📚',
  qa: '❓',
  ideas: '💡',
};

export const DISCUSSION_CATEGORY_TONE: Record<DiscussionCategory, 'neutral' | 'accent' | 'done' | 'attention'> = {
  announcements: 'attention',
  journal_club: 'accent',
  qa: 'neutral',
  ideas: 'done',
};

export const DISCUSSION_CATEGORY_ORDER: DiscussionCategory[] = ['announcements', 'journal_club', 'qa', 'ideas'];
