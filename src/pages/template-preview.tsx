import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Clock, User, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTemplatesStore } from '@/lib/store/templates-store';
import { useToast } from '@/hooks/use-toast';
import { CloneTemplateDialog } from '@/components/dashboard/clone-template-dialog';
import { MetricCard } from '@/components/metrics/metric-card';
import { BarChart3, Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail } from 'lucide-react';

export default function TemplatePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { currentTemplate, isLoading, error, fetchTemplate } = useTemplatesStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (id) {
      fetchTemplate(id).catch(error => {
        console.error('Error fetching template:', error);
        toast({
          title: 'Error',
          description: 'Failed to load template',
          variant: 'destructive',
        });
      });
    }
  }, [id, fetchTemplate, toast]);
  
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }
  
  if (error || !currentTemplate) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Template not found'}</p>
        <Button 
          onClick={() => navigate('/templates')}
          variant="outline"
        >
          Back to Templates
        </Button>
      </div>
    );
  }
  
  const timeAgo = formatDistanceToNow(new Date(currentTemplate.created_at), { addSuffix: true });
  
  // Generate example metrics for preview
  const exampleMetrics = {
    totalActivities: 1250,
    totalColdCalls: 450,
    totalTextMessages: 320,
    totalFacebookDms: 180,
    totalLinkedinDms: 150,
    totalInstagramDms: 90,
    totalColdEmails: 60
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{currentTemplate.name}</h1>
          <p className="text-muted-foreground">
            {currentTemplate.description || 'No description provided'}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          Use Template
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {currentTemplate.category && (
          <Badge variant="secondary">
            {currentTemplate.category}
          </Badge>
        )}
        <Badge variant={currentTemplate.visibility === 'public' ? 'outline' : 'secondary'}>
          {currentTemplate.visibility === 'public' ? 'Public' : 'Private'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Download className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{currentTemplate.downloads_count}</p>
            <p className="text-xs text-muted-foreground">Downloads</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{timeAgo}</p>
            <p className="text-xs text-muted-foreground">Created</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Template Owner</p>
            <p className="text-xs text-muted-foreground">ID: {currentTemplate.owner_id.slice(0, 8)}...</p>
          </div>
        </Card>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-medium">Preview</h2>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-6 border border-dashed">
          <div className="text-sm text-muted-foreground mb-4">
            This is a preview with example data. Your actual dashboard will use your own data.
          </div>
          
          {/* Example metrics display */}
          <div className="grid gap-4 grid-cols-7">
            <MetricCard
              title="Total Activities"
              value={exampleMetrics.totalActivities.toString()}
              icon={BarChart3}
            />
            <MetricCard
              title="Cold Calls"
              value={exampleMetrics.totalColdCalls.toString()}
              icon={Phone}
            />
            <MetricCard
              title="Text Messages"
              value={exampleMetrics.totalTextMessages.toString()}
              icon={MessageSquare}
            />
            <MetricCard
              title="Facebook DMs"
              value={exampleMetrics.totalFacebookDms.toString()}
              icon={Facebook}
            />
            <MetricCard
              title="LinkedIn DMs"
              value={exampleMetrics.totalLinkedinDms.toString()}
              icon={Linkedin}
            />
            <MetricCard
              title="Instagram DMs"
              value={exampleMetrics.totalInstagramDms.toString()}
              icon={Instagram}
            />
            <MetricCard
              title="Cold Emails"
              value={exampleMetrics.totalColdEmails.toString()}
              icon={Mail}
            />
          </div>
          
          {/* Display custom metrics from the template */}
          {currentTemplate.config.metrics.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Custom Metrics</h3>
              <div className="grid gap-4 grid-cols-3">
                {currentTemplate.config.metrics.map((metric, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-medium">{metric.name || `Metric ${index + 1}`}</h4>
                    <p className="text-sm text-muted-foreground">
                      {metric.type === 'total' 
                        ? `Sum of ${metric.metrics.join(', ')}`
                        : `Ratio of ${metric.metrics[0]} to ${metric.metrics[1]}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Display: {metric.displayType}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Clone Template Dialog */}
      {currentTemplate && (
        <CloneTemplateDialog
          template={currentTemplate}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
