import { ActivityType } from '@/components/dashboard/activity-filter';

export interface TeamActivity {
  id: ActivityType;
  label: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  team_members: string[];
  quota: number;
  default_activities: TeamActivity[];
}

export interface TeamMember {
  email: string;
  name: string;
  isOwner: boolean;
}