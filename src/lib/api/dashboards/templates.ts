import { supabase } from '@/lib/supabase';
import type {
  DashboardTemplate,
  CreateTemplateParams,
  UpdateTemplateParams,
  CloneTemplateParams,
  Dashboard
} from './types';
import { createDashboard, getDashboard } from './queries';

/**
 * Get all templates (public ones and private ones owned by current user)
 */
export async function getTemplates(): Promise<DashboardTemplate[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const user = userData.user;
  if (!user) throw new Error('User not authenticated');

  // Get templates that are either public or owned by the current user
  const { data, error } = await supabase
    .from('dashboard_templates')
    .select('*')
    .or(`visibility.eq.public,owner_id.eq.${user.id}`);
  
  if (error) throw error;
  return data || [];
}

/**
 * Get public templates for the marketplace
 */
export async function getPublicTemplates(): Promise<DashboardTemplate[]> {
  const { data, error } = await supabase
    .from('dashboard_templates')
    .select('*')
    .eq('visibility', 'public')
    .order('downloads_count', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(id: string): Promise<DashboardTemplate> {
  const { data, error } = await supabase
    .from('dashboard_templates')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Create a new template
 */
export async function createTemplate(params: CreateTemplateParams): Promise<DashboardTemplate> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const user = userData.user;
  if (!user) throw new Error('User not authenticated');

  let config = params.config;

  // If dashboard_id is provided, get the dashboard config and convert it to a template
  if (params.dashboard_id) {
    const dashboard = await getDashboard(params.dashboard_id);
    
    // Use the dashboard's config but strip any user-specific data
    // This is a simple implementation - you might need more complex logic
    config = dashboard.config;
  }

  const { data, error } = await supabase
    .from('dashboard_templates')
    .insert({
      name: params.name,
      description: params.description,
      config,
      category: params.category,
      visibility: params.visibility || 'private',
      owner_id: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update an existing template
 */
export async function updateTemplate(params: UpdateTemplateParams): Promise<DashboardTemplate> {
  const updates: any = {};
  
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.config !== undefined) updates.config = params.config;
  if (params.category !== undefined) updates.category = params.category;
  if (params.visibility !== undefined) updates.visibility = params.visibility;
  
  const { data, error } = await supabase
    .from('dashboard_templates')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('dashboard_templates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Clone a template to create a new dashboard
 */
export async function cloneTemplate(params: CloneTemplateParams): Promise<Dashboard> {
  // First, increment the downloads count
  const { error: updateError } = await supabase.rpc('increment_template_downloads', {
    template_id: params.template_id
  });
  
  if (updateError) {
    console.error('Failed to increment downloads count:', updateError);
    // Continue anyway - this is not critical
  }

  // Get the template
  const template = await getTemplate(params.template_id);
  
  // Create a new dashboard using the template config
  return createDashboard({
    title: params.title || template.name,
    description: params.description || template.description,
    config: template.config,
    team_id: params.team_id
  });
}

/**
 * Validate if a template is compatible with the current user's data
 * This checks if all metric keys referenced in the template exist in the user's data
 */
export async function validateTemplateCompatibility(templateId: string): Promise<{
  compatible: boolean;
  missingMetrics: string[];
}> {
  // Get the template
  const template = await getTemplate(templateId);
  
  // Get all metric keys used in the template
  const metricKeys = new Set<string>();
  template.config.metrics.forEach(metric => {
    if (Array.isArray(metric.metrics)) {
      metric.metrics.forEach(key => metricKeys.add(key));
    }
  });
  
  // These are the metrics we know are available in the system
  const availableMetrics = [
    'cold_calls', 'text_messages', 'facebook_dms', 'linkedin_dms', 
    'instagram_dms', 'cold_emails', 'quotes', 'booked_calls',
    'completed_calls', 'booked_presentations', 'completed_presentations',
    'submitted_applications', 'deals_won', 'deal_value'
  ];
  
  // Check which metrics are missing
  const missingMetrics = Array.from(metricKeys).filter(
    key => !availableMetrics.includes(key)
  );
  
  return {
    compatible: missingMetrics.length === 0,
    missingMetrics
  };
}
