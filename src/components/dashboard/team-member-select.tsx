import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeamStore } from '@/lib/store/team-store';

interface TeamMemberSelectProps {
  selectedMembers: string[];
  onSelectionChange: (members: string[]) => void;
}

export function TeamMemberSelect({ selectedMembers, onSelectionChange }: TeamMemberSelectProps) {
  const { team, memberData } = useTeamStore();
  const members = team?.team_members || [];

  const handleMemberToggle = (email: string | 'all') => {
    if (email === 'all') {
      // Toggle between all members and none
      const allMembersSelected = members.every(email => 
        selectedMembers.includes(email)
      );
      
      onSelectionChange(allMembersSelected ? [] : [...members]);
    } else {
      // Toggle individual member
      const newSelection = selectedMembers.includes(email)
        ? selectedMembers.filter(e => e !== email)
        : [...selectedMembers, email];
      onSelectionChange(newSelection);
    }
  };

  // Calculate if all members are selected
  const allMembersSelected = members.length > 0 && 
    members.every(email => selectedMembers.includes(email));

  // Get selected count
  const validSelectedCount = selectedMembers.filter(email => 
    members.includes(email)
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          {validSelectedCount === 0
            ? 'All Team Members'
            : validSelectedCount === members.length
            ? 'All Team Members'
            : `${validSelectedCount} Selected`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[200px]"
        align="start"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DropdownMenuCheckboxItem
          checked={allMembersSelected}
          onCheckedChange={() => handleMemberToggle('all')}
        >
          All Team Members
        </DropdownMenuCheckboxItem>
        {members.map(email => {
          const member = memberData[email];
          return (
            <DropdownMenuCheckboxItem
              key={email}
              checked={selectedMembers.includes(email)}
              onCheckedChange={() => handleMemberToggle(email)}
            >
              {member?.name || email.split('@')[0]}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}