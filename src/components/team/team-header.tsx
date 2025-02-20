import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

interface TeamHeaderProps {
  teamName: string;
  onUpdateName: (name: string) => void;
}

export function TeamHeader({ teamName, onUpdateName }: TeamHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(teamName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdateName(name.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-sm"
            autoFocus
          />
          <Button type="submit" size="sm">Save</Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setName(teamName);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">{teamName}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Rename Team
          </Button>
        </>
      )}
    </div>
  );
}