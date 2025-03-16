import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function TeamBanner() {
  return (
    <Card className="bg-card border border-primary/10 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Add Team Members</h3>
            <p className="text-sm text-muted-foreground">
              Get team wide analytics of your team performance
            </p>
          </div>
        </div>
        <Button
          variant="default"
          onClick={() => window.open('https://cal.com/tymek/getmykpi', '_blank')}
        >
          Add Seats Now
        </Button>
      </div>
    </Card>
  );
}