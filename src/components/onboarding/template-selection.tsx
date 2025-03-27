import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { getSuggestedTemplates, cloneTemplateForUser } from '@/lib/api/onboarding/templates';
import { DashboardTemplate } from '@/lib/api/dashboards/types';
import { useTeamStore } from '@/lib/store/team-store';
import { Download, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateSelectionProps {
  onComplete: () => void;
}

export function TemplateSelection({ onComplete }: TemplateSelectionProps) {
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { team, initialize: initializeTeam } = useTeamStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // First initialize the team store
        await initializeTeam();
        
        // Then fetch the templates
        const suggestedTemplates = await getSuggestedTemplates();
        console.log('Fetched templates:', suggestedTemplates);
        setTemplates(suggestedTemplates);
      } catch (error) {
        console.error('Error in template selection initialization:', error);
        toast({
          title: 'Error',
          description: 'Failed to load suggested templates',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [toast, initializeTeam]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Please select a template',
        description: 'You need to select a template to continue',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
      if (!selectedTemplateObj) {
        throw new Error('Selected template not found');
      }

      // Clone the template
      const dashboardId = await cloneTemplateForUser(
        selectedTemplate,
        selectedTemplateObj.name,
        team?.id
      );

      console.log('Dashboard created with ID:', dashboardId);

      // Store completion in localStorage to prevent showing again
      localStorage.setItem('onboarding_template_selected', 'true');
      
      toast({
        title: 'Dashboard created!',
        description: 'Your dashboard has been created successfully',
      });

      // Small delay to ensure state is updated before completing
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Error creating dashboard from template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dashboard from template',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Choose a Dashboard Template</CardTitle>
          <CardDescription>
            Select a template to get started with your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full flex flex-col overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardHeader>
                <CardContent className="flex-grow pb-2">
                  <Skeleton className="h-4 w-1/4 mt-2" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-2 border-t">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-1/3" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Choose a Dashboard Template</CardTitle>
        <CardDescription>
          Select a template to get started with your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`h-full flex flex-col overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${
                selectedTemplate === template.id ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader className="pb-2 relative">
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                )}
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                  {template.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <div className="flex flex-col gap-2">
                  {template.category && (
                    <Badge variant="secondary" className="w-fit">
                      {template.category}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {template.config.metrics.length} metric{template.config.metrics.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-3.5 w-3.5" />
                  <span>{template.downloads_count}</span>
                </div>
                <Button 
                  size="sm" 
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTemplate(template.id);
                  }}
                >
                  {selectedTemplate === template.id ? "Selected" : "Select"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedTemplate || submitting}
          className="w-full md:w-auto"
        >
          {submitting ? "Creating Dashboard..." : "Continue with Selected Template"}
        </Button>
      </CardFooter>
    </Card>
  );
}
