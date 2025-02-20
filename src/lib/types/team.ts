export interface Team {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  team_members: string[];
}

export interface TeamMember {
  email: string;
  name: string;
  isOwner: boolean;
}