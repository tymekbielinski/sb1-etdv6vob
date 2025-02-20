import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type DisplayMode = 'total' | 'breakdown' | 'members';

interface DisplaySettingsProps {
  value: DisplayMode[];
  onChange: (value: DisplayMode[]) => void;
}

const DISPLAY_OPTIONS = [
  { value: 'total', label: 'Total Activities' },
  { value: 'breakdown', label: 'Metrics Breakdown' },
  { value: 'members', label: 'Team Members' },
] as const;

export function DisplaySettings({ value, onChange }: DisplaySettingsProps) {
  const handleToggle = (mode: DisplayMode) => {
    // If selecting a new mode, clear others and set only this one
    if (!value.includes(mode)) {
      onChange([mode]);
      return;
    }
    
    // Don't allow deselecting the last option
    if (value.length === 1 && value[0] === mode) {
      return;
    }
    
    // Remove the mode
    onChange(value.filter(v => v !== mode));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Display Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>View Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DISPLAY_OPTIONS.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}