import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTemplatesStore } from '@/lib/store/templates-store';
import { useMetricsStore } from '@/lib/store/metrics-store';
import { convertMetricsStoreToConfig } from '@/lib/api/dashboards/queries';

export default function CreateTemplatePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTemplate } = useTemplatesStore();
  const { definitions, rows } = useMetricsStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for your template',
        variant: 'destructive',
      });
      return;
    }
    
    // Convert current metrics store state to config
    const config = convertMetricsStoreToConfig(definitions, rows);
    
    if (config.metrics.length === 0) {
      toast({
        title: 'Error',
        description: 'Your dashboard has no metrics. Add some metrics before creating a template.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const template = await createTemplate({
        name,
        description: description || undefined,
        config,
        category: category || undefined,
        visibility: isPublic ? 'public' : 'private',
      });
      
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      
      navigate(`/templates/preview/${template.id}`);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Predefined categories
  const categories = [
    'Sales',
    'Marketing',
    'Customer Success',
    'Operations',
    'Finance',
    'HR',
    'Other'
  ];
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Create Template</h1>
          <p className="text-muted-foreground">
            Create a reusable template from your current dashboard metrics
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Sales Performance Overview"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this template is useful for..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="visibility">Make Public</Label>
                  <span className="text-sm text-muted-foreground">
                    {isPublic ? (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Visible to everyone
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        Only visible to you
                      </span>
                    )}
                  </span>
                </div>
                <Switch
                  id="visibility"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Separator />
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Template Contents</h2>
          <p className="text-muted-foreground">
            This template will include the following metrics from your current dashboard:
          </p>
          
          <div className="bg-muted/30 rounded-lg p-6 border">
            {definitions.length > 0 ? (
              <ul className="space-y-2">
                {definitions.map((def) => (
                  <li key={def.id} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      {def.name || `${def.type === 'total' ? 'Total' : 'Conversion'} Metric`}
                      {' - '}
                      <span className="text-sm text-muted-foreground">
                        {def.type === 'total' 
                          ? `Sum of ${def.metrics.join(', ')}`
                          : `Ratio of ${def.metrics[0]} to ${def.metrics[1]}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No metrics found in your current dashboard</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || definitions.length === 0}>
            {isSubmitting ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}
