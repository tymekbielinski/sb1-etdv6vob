import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { createOrUpdateDailyLog, getDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';

const formSchema = z.object({
  quotes: z.number().min(0, 'Must be 0 or greater'),
  booked_calls: z.number().min(0, 'Must be 0 or greater'),
  completed_calls: z.number().min(0, 'Must be 0 or greater'),
  booked_presentations: z.number().min(0, 'Must be 0 or greater'),
  completed_presentations: z.number().min(0, 'Must be 0 or greater'),
  submitted_applications: z.number().min(0, 'Must be 0 or greater'),
});

type FormData = z.infer<typeof formSchema>;

interface InflowLogFormProps {
  onLogUpdated?: () => void;
  selectedDate?: Date;
}

export function InflowLogForm({ onLogUpdated, selectedDate = new Date() }: InflowLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quotes: 0,
      booked_calls: 0,
      completed_calls: 0,
      booked_presentations: 0,
      completed_presentations: 0,
      submitted_applications: 0,
    },
  });

  useEffect(() => {
    async function loadLog() {
      if (!user?.id || !team?.id) return;

      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const log = await getDailyLog(user.id, team.id, formattedDate);
        if (log) {
          form.reset({
            quotes: log.quotes || 0,
            booked_calls: log.booked_calls || 0,
            completed_calls: log.completed_calls || 0,
            booked_presentations: log.booked_presentations || 0,
            completed_presentations: log.completed_presentations || 0,
            submitted_applications: log.submitted_applications || 0,
          });
          setLastUpdated(new Date(log.created_at).toLocaleTimeString());
        } else {
          form.reset({
            quotes: 0,
            booked_calls: 0,
            completed_calls: 0,
            booked_presentations: 0,
            completed_presentations: 0,
            submitted_applications: 0,
          });
          setLastUpdated(null);
        }
      } catch (error) {
        console.error('Error loading log:', error);
      }
    }

    loadLog();
  }, [user?.id, team?.id, selectedDate, form]);

  const onSubmit = async (values: FormData) => {
    if (!user?.id || !team?.id) {
      toast({
        title: 'Error',
        description: 'User or team information is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const currentLog = await getDailyLog(user.id, team.id, formattedDate);
      await createOrUpdateDailyLog({
        ...currentLog,
        ...values,
        user_id: user.id,
        team_id: team.id,
        date: formattedDate,
      });

      setLastUpdated(new Date().toLocaleTimeString());
      toast({
        title: 'Success',
        description: `Opportunity log has been saved for ${format(selectedDate, 'PPP')}`,
      });
      
      onLogUpdated?.();
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save opportunity log',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Opportunities Log for {format(selectedDate, 'PPP')}</span>
          {lastUpdated && (
            <span className="text-sm font-normal text-muted-foreground">
              Last updated: {lastUpdated}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="quotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="booked_calls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booked Calls</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="completed_calls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completed Calls</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="booked_presentations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booked Presentations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="completed_presentations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completed Presentations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submitted_applications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submitted Applications</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Opportunity Log"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}