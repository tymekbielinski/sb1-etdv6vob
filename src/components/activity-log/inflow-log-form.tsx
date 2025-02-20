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
import { createOrUpdateDailyLog, getTodaysLog } from '@/lib/api/daily-logs/mutations';

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
}

export function InflowLogForm({ onLogUpdated }: InflowLogFormProps) {
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
    async function loadTodaysLog() {
      if (!user?.id || !team?.id) return;

      try {
        const log = await getTodaysLog(user.id, team.id);
        if (log) {
          form.reset({
            quotes: log.quotes,
            booked_calls: log.booked_calls,
            completed_calls: log.completed_calls,
            booked_presentations: log.booked_presentations,
            completed_presentations: log.completed_presentations,
            submitted_applications: log.submitted_applications,
          });
          setLastUpdated(new Date(log.created_at).toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error loading today\'s log:', error);
      }
    }

    loadTodaysLog();
  }, [user?.id, team?.id, form]);

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
      const currentLog = await getTodaysLog(user.id, team.id);
      await createOrUpdateDailyLog({
        ...currentLog,
        ...values,
        user_id: user.id,
        team_id: team.id,
        date: new Date().toISOString().split('T')[0],
      });

      setLastUpdated(new Date().toLocaleTimeString());
      toast({
        title: 'Success',
        description: 'Inflow log has been saved',
      });
      
      onLogUpdated?.();
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save inflow log',
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
          <span>Today's Opportunities Log</span>
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
              {isLoading ? "Saving..." : "Save Inflow Log"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}