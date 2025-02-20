import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamMemberRow } from './team-member-row';
import { useTeamStore } from '@/lib/store/team-store';

export function TeamRoster() {
  const { team, memberData } = useTeamStore();
  const members = team?.team_members || [];

  const membersList = members.map(email => ({
    email,
    name: memberData[email]?.name || email.split('@')[0],
    isOwner: team?.user_id === memberData[email]?.id
  }));

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