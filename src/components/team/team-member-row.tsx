import { Mail } from 'lucide-react';
import type { TeamMember } from '@/lib/types/team';

interface TeamMemberRowProps {
  member: TeamMember;
}

export function TeamMemberRow({ member }: TeamMemberRowProps) {
  const initials = member.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-muted/20">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium">{initials}</span>
        </div>
        <div>
          <p className="font-medium">{member.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{member.email}</span>
            {member.isOwner && (
              <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                Team Owner
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}