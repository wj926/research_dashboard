'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

export function MarkdownBody({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('prose prose-sm max-w-none text-fg-default [&_a]:text-accent-fg [&_code]:bg-canvas-inset [&_code]:px-1 [&_code]:rounded [&_pre]:bg-canvas-inset [&_pre]:p-3 [&_pre]:rounded-md', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
