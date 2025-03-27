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
import { createTeam } from '@/lib/api/team';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { InfoCircledIcon } from '@radix-ui/react-icons';

const formSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
});

interface TeamOnboardingProps {
  onComplete: () => void;
  suggestedName?: string;
}

export function TeamOnboarding({ onComplete, suggestedName = '' }: TeamOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Ensure we have a valid suggested name
  const defaultTeamName = suggestedName || '';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: defaultTeamName,
    },
  });
  
  // Update the form value when suggestedName changes
  useEffect(() => {
    if (suggestedName) {
      form.setValue('teamName', suggestedName);
    }
  }, [suggestedName, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found. Please try again or contact support.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createTeam(values.teamName, user.email);
      
      toast({
        title: "Team Created!",
        description: "Your team has been created successfully.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Team creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message
          : "Failed to create team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Create Your Team</CardTitle>
        <CardDescription>
          Let's set up your team to get started with GetMyKPI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-sm">
              <InfoCircledIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-muted-foreground">
                You'll be able to add team members later in the team settings.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating team..." : "Create Team"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
