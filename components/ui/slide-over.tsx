'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from '@primer/octicons-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/**
 * Right-side drawer built on Radix Dialog. Used for create/edit flows
 * that should not take over the page (Phase 21).
 *
 * The existing URL routes (/projects/[slug]/papers/new etc.) still work
 * as full-page fallbacks and for direct linking.
 */
export function SlideOver({
  open,
  onOpenChange,
  title,
  children,
  widthClass = 'max-w-lg',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Tailwind width class for the panel. Defaults to `max-w-lg`. */
  widthClass?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-fg-default/30 transition-opacity duration-200',
            'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed right-0 top-0 bottom-0 z-50 w-full bg-white shadow-xl flex flex-col',
            'transform transition-transform duration-200 ease-out',
            'data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full',
            widthClass,
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close panel"
              className="text-fg-muted hover:text-fg-default p-1 rounded hover:bg-canvas-subtle"
            >
              <XIcon size={16} />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
