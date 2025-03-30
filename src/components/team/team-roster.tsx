import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamMemberRow } from './team-member-row';
import { useTeamStore } from '@/lib/store/team-store';

export function TeamRoster() {
  const { team, memberData } = useTeamStore();
  const members = team?.team_members || [];

  // Safely create member objects with fallbacks for all properties
  const membersList = members.map(email => {
    // Ensure email is a string to prevent toLowerCase errors
    const safeEmail = typeof email === 'string' ? email : '';
    
    return {
      email: safeEmail,
      // Provide fallback for name
      name: memberData[safeEmail]?.name || safeEmail.split('@')[0] || 'Unknown',
      // No owner check needed as per user's request
      isOwner: false
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Roster ({membersList.length} members)</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="min-h-[200px] max-h-[500px] pr-4">
          {membersList.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No team members yet
            </div>
          ) : (
            <div className="space-y-4">
              {membersList.map((member) => (
                <TeamMemberRow
                  key={member.email}
                  member={member}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}