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
  coldCalls: z.number().min(0, 'Must be 0 or greater'),
  textMessages: z.number().min(0, 'Must be 0 or greater'),
  facebookDms: z.number().min(0, 'Must be 0 or greater'),
  linkedinDms: z.number().min(0, 'Must be 0 or greater'),
  instagramDms: z.number().min(0, 'Must be 0 or greater'),
  coldEmails: z.number().min(0, 'Must be 0 or greater'),
});

type FormData = z.infer<typeof formSchema>;

interface DailyLogFormProps {
  onLogUpdated?: () => void;
}

export function DailyLogForm({ onLogUpdated }: DailyLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coldCalls: 0,
      textMessages: 0,
      facebookDms: 0,
      linkedinDms: 0,
      instagramDms: 0,
      coldEmails: 0,
    },
  });

  useEffect(() => {
    async function loadTodaysLog() {
      if (!user?.id || !team?.id) return;

      try {
        const log = await getTodaysLog(user.id, team.id);
        if (log) {
          form.reset({
            coldCalls: log.cold_calls,
            textMessages: log.text_messages,
            facebookDms: log.facebook_dms,
            linkedinDms: log.linkedin_dms,
            instagramDms: log.instagram_dms,
            coldEmails: log.cold_emails,
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
      await createOrUpdateDailyLog({
        cold_calls: values.coldCalls,
        text_messages: values.textMessages,
        facebook_dms: values.facebookDms,
        linkedin_dms: values.linkedinDms,
        instagram_dms: values.instagramDms,
        cold_emails: values.coldEmails,
        user_id: user.id,
        team_id: team.id,
        date: new Date().toISOString().split('T')[0],
      });

      setLastUpdated(new Date().toLocaleTimeString());
      toast({
        title: 'Success',
        description: 'Activity log has been saved',
      });
      
      // Notify parent component that log was updated
      onLogUpdated?.();
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save activity log',
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
          <span>Today's Activity Log</span>
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
                name="coldCalls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cold Calls</FormLabel>
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
                name="textMessages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Messages</FormLabel>
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
                name="facebookDms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook DMs</FormLabel>
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
                name="linkedinDms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn DMs</FormLabel>
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
                name="instagramDms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram DMs</FormLabel>
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
                name="coldEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cold Emails</FormLabel>
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
              {isLoading ? "Saving..." : "Save Activity Log"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}