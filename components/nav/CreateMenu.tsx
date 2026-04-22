'use client';

import { PlusIcon, ChevronDownIcon } from '@primer/octicons-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-80" aria-label="Create new">
        <PlusIcon size={16} /><ChevronDownIcon size={12} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-fg-default">
        <DropdownMenuItem>New project</DropdownMenuItem>
        <DropdownMenuItem>New paper</DropdownMenuItem>
        <DropdownMenuItem>New experiment</DropdownMenuItem>
        <DropdownMenuItem>New discussion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
