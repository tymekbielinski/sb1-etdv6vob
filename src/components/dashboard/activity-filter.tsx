import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const ACTIVITY_LABELS: Record<ActivityType | 'all', string> = {
  all: 'All Activities',
  cold_calls: 'Cold Calls',
  text_messages: 'Text Messages',
  facebook_dms: 'Facebook DMs',
  linkedin_dms: 'LinkedIn DMs',
  instagram_dms: 'Instagram DMs',
  cold_emails: 'Cold Emails',
};

const ACTIVITIES: ActivityType[] = [
  'cold_calls',
  'text_messages',
  'facebook_dms',
  'linkedin_dms',
  'instagram_dms',
  'cold_emails',
];

export function ActivityFilter({ selectedActivities, onSelectionChange }: ActivityFilterProps) {
  const handleActivityToggle = (activity: ActivityType | 'all') => {
    if (activity === 'all') {
      // Toggle between all activities and none
      const allActivitiesSelected = ACTIVITIES.every(a => 
        selectedActivities.includes(a)
      );
      
      onSelectionChange(allActivitiesSelected ? [] : [...ACTIVITIES]);
    } else {
      // Toggle individual activity
      const newSelection = selectedActivities.includes(activity)
        ? selectedActivities.filter(a => a !== activity)
        : [...selectedActivities, activity];
      
      onSelectionChange(newSelection);
    }
  };

  // Calculate if all activities are selected
  const allActivitiesSelected = ACTIVITIES.every(activity => 
    selectedActivities.includes(activity)
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          {selectedActivities.length === 0
            ? 'Select Activities'
            : selectedActivities.length === ACTIVITIES.length
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
          {ACTIVITY_LABELS.all}
        </DropdownMenuCheckboxItem>
        {ACTIVITIES.map(activity => (
          <DropdownMenuCheckboxItem
            key={activity}
            checked={selectedActivities.includes(activity)}
            onCheckedChange={() => handleActivityToggle(activity)}
          >
            {ACTIVITY_LABELS[activity]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}