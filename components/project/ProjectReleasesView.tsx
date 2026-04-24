'use client';

import { useState } from 'react';
import { PlusIcon, MarkGithubIcon, LinkExternalIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { SlideOver } from '@/components/ui/slide-over';
import { LabelChip } from '@/components/badges/LabelChip';
import { EmptyState } from '@/components/misc/EmptyState';
import { ReleaseRowActions } from './ReleaseRowActions';
import { ReleaseForm } from './ReleaseForm';
import type { Release, ReleaseKind } from '@/lib/types';

const KIND_TONE: Record<ReleaseKind, 'neutral' | 'accent' | 'done' | 'success'> = {
  dataset: 'accent',
  tool: 'neutral',
  skill: 'done',
  model: 'success',
};

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; release: Release };

export function ProjectReleasesView({
  projectSlug,
  releases,
}: {
  projectSlug: string;
  releases: Release[];
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
        <PlusIcon size={14} /> New release
      </button>
    </div>
  );

  return (
    <div>
      {newButton}
      {releases.length === 0 ? (
        <EmptyState
          title="No releases"
          body="Datasets, tools, and Claude Code skills released by this project show here."
        />
      ) : (
        <ul className="bg-white border border-border-default rounded-md divide-y divide-border-muted">
          {releases.map(r => {
            const fromGitHub = r.source === 'github';
            return (
              <li key={r.id} className="group px-4 py-3 flex items-start gap-3">
                <LabelChip tone={KIND_TONE[r.kind]}>{r.kind}</LabelChip>
                {fromGitHub && (
                  <LabelChip tone="neutral" className="inline-flex items-center gap-1">
                    <MarkGithubIcon size={10} />
                    GitHub
                  </LabelChip>
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {r.name}{' '}
                    <span className="text-fg-muted text-xs">{r.version}</span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-fg-muted mt-1">{r.description}</p>
                  )}
                  <div className="text-xs text-fg-muted mt-1">
                    Published {new Date(r.publishedAt).toDateString()}
                  </div>
                </div>
                {fromGitHub ? (
                  r.downloadUrl && (
                    <a
                      href={r.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View on GitHub"
                      className="inline-flex items-center gap-1 text-accent-fg text-xs hover:underline"
                    >
                      View on GitHub <LinkExternalIcon size={12} />
                    </a>
                  )
                ) : (
                  <>
                    {r.downloadUrl && (
                      <a
                        href={r.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-fg text-xs hover:underline"
                      >
                        Download
                      </a>
                    )}
                    <ReleaseRowActions
                      projectSlug={projectSlug}
                      releaseId={r.id}
                      onEdit={() => setPanel({ mode: 'edit', release: r })}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <SlideOver
        open={panel.mode === 'create'}
        onOpenChange={o => !o && close()}
        title="New release"
        widthClass="max-w-2xl"
      >
        {panel.mode === 'create' && (
          <ReleaseForm
            mode="create"
            projectSlug={projectSlug}
            onSuccess={onFormSuccess}
            onCancel={close}
          />
        )}
      </SlideOver>

      <SlideOver
        open={panel.mode === 'edit'}
        onOpenChange={o => !o && close()}
        title="Edit release"
        widthClass="max-w-2xl"
      >
        {panel.mode === 'edit' && (
          <ReleaseForm
            mode="edit"
            projectSlug={projectSlug}
            initial={panel.release}
            onSuccess={onFormSuccess}
            onCancel={close}
          />
        )}
      </SlideOver>
    </div>
  );
}
