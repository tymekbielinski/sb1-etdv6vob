import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeamStore } from '@/lib/store/team-store';
import { TeamActivity } from '@/lib/types/team';

export type ActivityType = 
  | 'cold_calls'
  | 'text_messages'
  | 'facebook_dms'
  | 'linkedin_dms'
  | 'instagram_dms'
  | 'cold_emails';

interface ActivityFilterProps {
  selectedActivities: ActivityType[];
  onSelectionChange: (activities: ActivityType[]) => void;
}

const DEFAULT_ACTIVITIES: TeamActivity[] = [
  { id: 'cold_calls', label: 'Cold Calls' },
  { id: 'text_messages', label: 'Text Messages' },
  { id: 'facebook_dms', label: 'Facebook DMs' },
  { id: 'linkedin_dms', label: 'LinkedIn DMs' },
  { id: 'instagram_dms', label: 'Instagram DMs' },
  { id: 'cold_emails', label: 'Cold Emails' }
];

export function ActivityFilter({ selectedActivities, onSelectionChange }: ActivityFilterProps) {
  const { team } = useTeamStore();
  const activities = (team?.default_activities ?? DEFAULT_ACTIVITIES).filter(activity => 
    DEFAULT_ACTIVITIES.some(defaultActivity => defaultActivity.id === activity.id)
  );

  const handleActivityToggle = (activity: ActivityType | 'all') => {
    if (activity === 'all') {
      // Toggle between all activities and none
      const allActivitiesSelected = activities.every(a => 
        selectedActivities.includes(a.id)
      );
      
      onSelectionChange(allActivitiesSelected ? [] : activities.map(a => a.id));
    } else {
      // Toggle individual activity
      const newSelection = selectedActivities.includes(activity)
        ? selectedActivities.filter(a => a !== activity)
        : [...selectedActivities, activity];
      
      onSelectionChange(newSelection);
    }
  };

  // Calculate if all activities are selected
  const allActivitiesSelected = activities.every(activity => 
    selectedActivities.includes(activity.id)
  );

  const getActivityLabel = (activity: ActivityType | 'all'): string => {
    if (activity === 'all') return 'All Activities';
    const activityItem = activities.find(a => a.id === activity);
    return activityItem?.label ?? activity;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          {selectedActivities.length === 0
            ? 'Select Activities'
            : selectedActivities.length === activities.length
            ? 'All Activities'
            : `${selectedActivities.length} Selected`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[200px]"
        align="end"
        // Remove autoClose behavior
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DropdownMenuCheckboxItem
          checked={allActivitiesSelected}
          onCheckedChange={() => handleActivityToggle('all')}
        >
          All Activities
        </DropdownMenuCheckboxItem>
        {activities.map((activity) => (
          <DropdownMenuCheckboxItem
            key={activity.id}
            checked={selectedActivities.includes(activity.id)}
            onCheckedChange={() => handleActivityToggle(activity.id)}
          >
            {activity.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}