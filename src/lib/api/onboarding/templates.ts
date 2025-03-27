import { supabase } from '@/lib/supabase';
import { DashboardTemplate } from '@/lib/api/dashboards/types';
import { cloneTemplate } from '@/lib/api/dashboards/templates';

// IDs of the suggested templates for onboarding
const SUGGESTED_TEMPLATE_IDS = [
  '29063aac-f779-4bee-b9d2-49cf6580a885',
  '876de191-a23c-46cd-a24b-54a8932f5723',
  'bcd4593c-0bd0-4037-8d6e-792cdac9f2b0'
];

// Fallback to fetch all templates if the specific ones aren't found
export async function getSuggestedTemplates(): Promise<DashboardTemplate[]> {
  try {
    // First try to get the specific templates
    const { data, error } = await supabase
      .from('dashboard_templates')
      .select('*')
      .in('id', SUGGESTED_TEMPLATE_IDS);
    
    if (error) {
      console.error('Error fetching suggested templates:', error);
      throw error;
    }
    
    // If we found the specific templates, return them
    if (data && data.length > 0) {
      console.log('Found specific templates:', data.length);
      return data;
    }
    
    // If we didn't find the specific templates, get all public templates
    console.log('No specific templates found, fetching all public templates');
    const { data: publicData, error: publicError } = await supabase
      .from('dashboard_templates')
      .select('*')
      .eq('visibility', 'public')
      .limit(3);
    
    if (publicError) {
      console.error('Error fetching public templates:', publicError);
      throw publicError;
    }
    
    return publicData || [];
  } catch (error) {
    console.error('Error in getSuggestedTemplates:', error);
    throw error;
  }
}



/**
 * Clones a template and assigns it to the user or team
 */
export async function cloneTemplateForUser(
  templateId: string, 
  title: string, 
  teamId?: string
): Promise<string> {
  try {
    console.log('Cloning template:', { templateId, title, teamId });
    
    // Get the user ID for logging
    const { data: userData } = await supabase.auth.getUser();
    console.log('Current user:', userData?.user?.id);
    
    // Clone the template
    const dashboard = await cloneTemplate({
      template_id: templateId,
      title,
      team_id: teamId
    });
    
    console.log('Dashboard created successfully:', dashboard.id);
    return dashboard.id;
  } catch (error) {
    console.error('Error cloning template for user:', error);
    throw error;
  }
}
