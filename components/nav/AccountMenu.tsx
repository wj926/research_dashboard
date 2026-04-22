'use client';

import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/people/Avatar';
import { CURRENT_USER } from '@/lib/mock';

export function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="rounded-full">
        <Avatar login={CURRENT_USER} size={24} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-fg-default">
        <DropdownMenuItem asChild>
          <Link href={`/members/${CURRENT_USER}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
