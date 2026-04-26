'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { AlertIcon, TrashIcon, PlusIcon } from '@primer/octicons-react';
import type { Venue, VenueKind } from '@/lib/types';
import { daysUntil } from '@/lib/time';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  createVenueAction,
  updateVenueAction,
  deleteVenueAction,
  type CreateVenueState,
} from '@/lib/actions/venues';
import { cn } from '@/lib/cn';

const KIND_OPTIONS: readonly VenueKind[] = ['abstract', 'full', 'camera_ready', 'rebuttal'];

export function DeadlineList({
  venues,
  now,
  title = 'Upcoming',
}: {
  venues: Venue[];
  now: number;
  title?: string;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="bg-white border border-border-default rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold">
          {title}
        </h3>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Add venue"
              className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border border-border-default text-fg-muted hover:bg-canvas-subtle"
            >
              <PlusIcon size={10} />
              Add
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-80"
            onOpenAutoFocus={e => e.preventDefault()}
          >
            <AddVenueForm onClose={() => setAddOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>
      {venues.length === 0 ? (
        <p className="text-xs text-fg-muted">No upcoming deadlines.</p>
      ) : (
        <ul className="space-y-2">
          {venues.map(v => (
            <VenueRow key={v.id} venue={v} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VenueRow({ venue, now }: { venue: Venue; now: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Edit venue: ${venue.name}`}
            className="w-full text-left text-sm flex items-baseline justify-between gap-3 rounded px-1 -mx-1 py-0.5 hover:bg-canvas-subtle focus-visible:outline-none focus-visible:bg-canvas-subtle"
          >
            <span className="min-w-0 truncate">
              <span className="font-medium">{venue.name}</span>
              <span className="text-fg-muted"> · {venue.kind.replace('_', ' ')}</span>
            </span>
            <span className="text-xs text-fg-muted whitespace-nowrap">
              in {daysUntil(venue.deadline, now)}d
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-80"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <EditVenueForm venue={venue} onClose={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </li>
  );
}

function AddVenueForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<CreateVenueState, FormData>(
    createVenueAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(false);

  useEffect(() => {
    if (prevPending.current && !pending && !state?.error) {
      formRef.current?.reset();
      onClose();
    }
    prevPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <h3 className="text-sm font-semibold">Add venue</h3>

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 bg-danger-subtle border border-danger-subtle rounded-md p-2 text-xs text-danger-fg"
        >
          <AlertIcon size={12} className="mt-0.5 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs text-fg-muted">
        <span>Name</span>
        <input
          type="text"
          name="name"
          required
          placeholder="NeurIPS 2026 abstract"
          aria-label="Name"
          className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          <span>Deadline</span>
          <input
            type="date"
            name="deadline"
            required
            aria-label="Deadline"
            className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          <span>Kind</span>
          <select
            name="kind"
            required
            defaultValue="full"
            aria-label="Kind"
            className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
          >
            {KIND_OPTIONS.map(k => (
              <option key={k} value={k}>{k.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-md bg-success-emphasis text-white font-medium hover:bg-success-fg disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-md border border-border-default text-fg-muted hover:bg-canvas-subtle disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditVenueForm({
  venue,
  onClose,
}: {
  venue: Venue;
  onClose: () => void;
}) {
  const [savingPending, startSaving] = useTransition();
  const [deletingPending, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startSaving(async () => {
      try {
        await updateVenueAction(venue.id, formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update venue');
      }
    });
  };

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setError(null);
    startDeleting(async () => {
      try {
        await deleteVenueAction(venue.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete venue');
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold">Edit venue</h3>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 bg-danger-subtle border border-danger-subtle rounded-md p-2 text-xs text-danger-fg"
        >
          <AlertIcon size={12} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs text-fg-muted">
        <span>Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={venue.name}
          aria-label="Name"
          className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          <span>Deadline</span>
          <input
            type="date"
            name="deadline"
            required
            defaultValue={venue.deadline.slice(0, 10)}
            aria-label="Deadline"
            className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          <span>Kind</span>
          <select
            name="kind"
            required
            defaultValue={venue.kind}
            aria-label="Kind"
            className="text-xs px-2 py-1 rounded-md border border-border-default focus:outline-none focus:border-accent-emphasis"
          >
            {KIND_OPTIONS.map(k => (
              <option key={k} value={k}>{k.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={savingPending || deletingPending}
          className="text-xs px-3 py-1.5 rounded-md bg-success-emphasis text-white font-medium hover:bg-success-fg disabled:opacity-50"
        >
          {savingPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={savingPending || deletingPending}
          className="text-xs px-3 py-1.5 rounded-md border border-border-default text-fg-muted hover:bg-canvas-subtle disabled:opacity-50"
        >
          Cancel
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDelete}
          disabled={savingPending || deletingPending}
          aria-label={confirmDelete ? 'Click again to confirm delete' : 'Delete venue'}
          className={cn(
            'text-xs px-2 h-7 rounded-md inline-flex items-center gap-1 transition-colors disabled:opacity-50',
            confirmDelete
              ? 'bg-danger-emphasis text-white hover:bg-danger-fg'
              : 'text-danger-fg hover:bg-danger-subtle',
          )}
        >
          <TrashIcon size={12} />
          {confirmDelete ? 'Click again' : 'Delete'}
        </button>
      </div>
    </form>
  );
}
