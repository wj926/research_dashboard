'use client';

import { useState } from 'react';
import { PlusIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/slide-over';
import { LabelChip } from '@/components/badges/LabelChip';
import { Avatar } from '@/components/people/Avatar';
import { EmptyState } from '@/components/misc/EmptyState';
import { PaperRowActions } from './PaperRowActions';
import { PaperCreateForm } from './PaperCreateForm';
import { PaperEditForm } from './PaperEditForm';
import {
  PAPER_STAGE_LABELS,
  PAPER_STAGE_ORDER,
  PAPER_STAGE_TONE,
} from '@/lib/labels';
import type { Paper, Member } from '@/lib/types';

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; paper: Paper };

export function ProjectPapersView({
  projectSlug,
  projectName,
  projectDescription,
  papers,
  members,
}: {
  projectSlug: string;
  projectName: string;
  projectDescription: string;
  papers: Paper[];
  members: Member[];
}) {
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' });
  const router = useRouter();

  function close() {
    setPanel({ mode: 'closed' });
  }
  function onFormSuccess() {
    close();
    router.refresh();
  }

  const newButton = (
    <div className="mb-3 flex justify-end">
      <button
        type="button"
        onClick={() => setPanel({ mode: 'create' })}
        className="px-3 h-8 inline-flex items-center gap-1 rounded-md border border-border-default text-sm hover:bg-canvas-subtle"
      >
        <PlusIcon size={14} /> New paper
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {newButton}
      {papers.length === 0 ? (
        <EmptyState
          title="No papers yet"
          body="When you add papers to this project, they'll appear here."
        />
      ) : (
        PAPER_STAGE_ORDER.map(stage => {
          const group = papers.filter(p => p.stage === stage);
          if (group.length === 0) return null;
          return (
            <section key={stage}>
              <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2">
                {PAPER_STAGE_LABELS[stage]}
              </h3>
              <ul className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
                {group.map(p => (
                  <li key={p.id} className="px-4 py-3 flex items-start gap-3">
                    <LabelChip tone={PAPER_STAGE_TONE[stage]}>
                      {PAPER_STAGE_LABELS[stage]}
                    </LabelChip>
                    <div className="flex-1">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-fg-muted mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          {p.authorLogins.map(l => (
                            <Avatar key={l} login={l} size={14} />
                          ))}
                        </span>
                        {p.venue && <span>· {p.venue}</span>}
                        {p.deadline && (
                          <span>· due {new Date(p.deadline).toDateString()}</span>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const href = p.pdfUrl ?? p.draftUrl;
                      if (!href) return null;
                      const kind = p.pdfUrl ? 'PDF' : 'Draft';
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-fg text-xs hover:underline"
                        >
                          {kind}
                        </a>
                      );
                    })()}
                    <PaperRowActions
                      projectSlug={projectSlug}
                      paperId={p.id}
                      onEdit={() => setPanel({ mode: 'edit', paper: p })}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <SlideOver
        open={panel.mode === 'create'}
        onOpenChange={o => !o && close()}
        title="New paper"
        widthClass="max-w-2xl"
      >
        {panel.mode === 'create' && (
          <PaperCreateForm
            projectSlug={projectSlug}
            projectName={projectName}
            projectDescription={projectDescription}
            members={members}
            onSuccess={onFormSuccess}
            onCancel={close}
          />
        )}
      </SlideOver>

      <SlideOver
        open={panel.mode === 'edit'}
        onOpenChange={o => !o && close()}
        title="Edit paper"
        widthClass="max-w-2xl"
      >
        {panel.mode === 'edit' && (
          <PaperEditForm
            paper={panel.paper}
            members={members}
            onSuccess={onFormSuccess}
            onCancel={close}
          />
        )}
      </SlideOver>
    </div>
  );
}
