import { Download, Star, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardTemplate } from '@/lib/api/dashboards/types';

interface TemplateCardProps {
  template: DashboardTemplate;
  onClone: (templateId: string) => void;
  onPreview: (templateId: string) => void;
}

export function TemplateCard({ template, onClone, onPreview }: TemplateCardProps) {
  const timeAgo = formatDistanceToNow(new Date(template.created_at), { addSuffix: true });
  
  // Count the number of metrics in the template
  const metricCount = template.config.metrics.length;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          {template.visibility === 'public' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Private
            </Badge>
          )}
        </div>
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
            {metricCount} metric{metricCount !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  <span>{template.downloads_count}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Downloads</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timeAgo}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Created {timeAgo}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPreview(template.id)}>
            Preview
          </Button>
          <Button size="sm" onClick={() => onClone(template.id)}>
            Use
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
