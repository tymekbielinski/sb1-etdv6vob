import { useState, useEffect } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateCard } from '@/components/dashboard/template-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTemplatesStore } from '@/lib/store/templates-store';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { DashboardTemplate } from '@/lib/api/dashboards/types';

export function TemplateGallery() {
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [filteredTemplates, setFilteredTemplates] = useState<DashboardTemplate[]>([]);
  
  const { 
    templates, 
    publicTemplates, 
    isLoading, 
    error, 
    fetchTemplates, 
    fetchPublicTemplates,
    cloneTemplate
  } = useTemplatesStore();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates().catch(error => {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    });
    
    fetchPublicTemplates().catch(error => {
      console.error('Error fetching public templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load public templates',
        variant: 'destructive',
      });
    });
  }, [fetchTemplates, fetchPublicTemplates, toast]);
  
  // Filter templates based on active tab, search query, and category
  useEffect(() => {
    let filtered: DashboardTemplate[] = [];
    
    switch (activeTab) {
      case 'all':
        filtered = templates;
        break;
      case 'public':
        filtered = publicTemplates;
        break;
      case 'my':
        filtered = templates.filter(t => t.visibility === 'private');
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => 
          t.name.toLowerCase().includes(query) || 
          (t.description && t.description.toLowerCase().includes(query)) ||
          (t.category && t.category.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    setFilteredTemplates(filtered);
  }, [templates, publicTemplates, activeTab, searchQuery, category]);
  
  // Get unique categories from all templates
  const categories = Array.from(
    new Set([
      ...templates.map(t => t.category).filter(Boolean) as string[],
      ...publicTemplates.map(t => t.category).filter(Boolean) as string[]
    ])
  ).sort();
  
  const handleClone = async (templateId: string) => {
    try {
      // First validate template compatibility
      const { compatible, missingMetrics } = await useTemplatesStore.getState().validateTemplateCompatibility(templateId);
      
      if (!compatible) {
        toast({
          title: 'Compatibility Issue',
          description: `This template uses metrics that are not available: ${missingMetrics.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
      
      // Clone the template
      const dashboard = await cloneTemplate({ template_id: templateId });
      
      toast({
        title: 'Success',
        description: 'Template cloned successfully',
      });
      
      // Navigate to the new dashboard
      navigate(`/dashboard/${dashboard.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone template',
        variant: 'destructive',
      });
    }
  };
  
  const handlePreview = (templateId: string) => {
    navigate(`/templates/preview/${templateId}`);
  };
  
  if (isLoading && !templates.length && !publicTemplates.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }
  
  if (error && !templates.length && !publicTemplates.length) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button 
          onClick={() => {
            fetchTemplates();
            fetchPublicTemplates();
          }}
          variant="outline"
        >
          Try again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Templates</h1>
        <p className="text-muted-foreground">
          Browse and use pre-built dashboard templates to quickly set up your analytics.
        </p>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => navigate('/templates/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="my">My Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex h-[30vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No templates found</p>
              {activeTab === 'my' && (
                <Button variant="outline" onClick={() => navigate('/templates/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClone={handleClone}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
