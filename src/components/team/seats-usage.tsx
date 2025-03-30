import { useTeamStore } from '@/lib/store/team-store';

export function SeatsUsage() {
  const { team } = useTeamStore();
  
  if (!team) return null;
  
  // Calculate seats used and total seats
  const seatsUsed = team.team_members.length;
  const totalSeats = team.quota + seatsUsed;
  const usagePercentage = Math.min(100, (seatsUsed / totalSeats) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Seats Usage</span>
        <span className="font-medium">{seatsUsed} / {totalSeats}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
        <div 
          className="h-full rounded-full bg-[#4335A7]" 
          style={{ width: `${usagePercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {team.quota} seat{team.quota !== 1 ? 's' : ''} available
      </p>
    </div>
  );
}
