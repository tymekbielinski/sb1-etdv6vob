import { useState } from 'react';
import { Save, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useTemplatesStore } from '@/lib/store/templates-store';
import type { Dashboard } from '@/lib/api/dashboards/types';

interface SaveAsTemplateProps {
  dashboard: Dashboard;
  onSuccess?: () => void;
}

export function SaveAsTemplate({ dashboard, onSuccess }: SaveAsTemplateProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(dashboard.title);
  const [description, setDescription] = useState(dashboard.description || '');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTemplate } = useTemplatesStore();
  const { toast } = useToast();
  
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
    
    setIsSubmitting(true);
    
    try {
      await createTemplate({
        name,
        description: description || undefined,
        config: dashboard.config,
        category: category || undefined,
        visibility: isPublic ? 'public' : 'private',
        dashboard_id: dashboard.id,
      });
      
      toast({
        title: 'Success',
        description: 'Dashboard saved as template',
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Save className="mr-2 h-4 w-4" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from this dashboard. Templates only store metric configurations, not your data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
