import type { 
  MetricDefinition, 
  DashboardConfig, 
  CreateTemplateParams,
  Dashboard,
  DashboardTemplate,
  CreateDashboardParams,
  UpdateDashboardParams,
  CloneTemplateParams
} from './types';

// Mock implementation of convertMetricsStoreToConfig
export function convertMetricsStoreToConfig(
  definitions: MetricDefinition[], 
  rows: { id: string; order: number; metrics: string[] }[]
): DashboardConfig {
  return {
    metrics: definitions,
    layout: rows
  };
}

// Mock implementation of createTemplate
export async function createTemplate(
  params: CreateTemplateParams,
  supabase?: any
): Promise<DashboardTemplate> {
  if (supabase) {
    // Use the provided Supabase client
    const { data, error } = await supabase
      .from('dashboard_templates')
      .insert({
        name: params.name,
        description: params.description || '',
        config: params.config,
        visibility: params.visibility || 'private',
        owner_id: 'test-user-id',
        category: params.category || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Default implementation if no Supabase client is provided
  return {
    id: 'template-1',
    name: params.name,
    description: params.description || '',
    config: params.config,
    visibility: params.visibility || 'private',
    owner_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    downloads_count: 0,
    category: params.category || ''
  };
}

// Mock implementation of getTemplate
export async function getTemplate(
  id: string,
  supabase?: any
): Promise<DashboardTemplate> {
  if (supabase) {
    // Use the provided Supabase client
    const { data, error } = await supabase
      .from('dashboard_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Default implementation if no Supabase client is provided
  return {
    id,
    name: 'Test Template',
    description: 'A test template',
    config: {
      metrics: [
        {
          id: 'metric-1',
          name: 'Total Activities',
          type: 'total',
          metrics: ['cold_calls', 'text_messages', 'facebook_dms'],
          displayType: 'number'
        },
        {
          id: 'metric-2',
          name: 'Conversion Rate',
          type: 'conversion',
          metrics: ['cold_calls', 'deals_won'],
          displayType: 'percentage'
        }
      ],
      layout: [
        {
          id: 'row-1',
          order: 0,
          metrics: ['metric-1', 'metric-2']
        }
      ]
    },
    visibility: 'private',
    owner_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    downloads_count: 0,
    category: 'Sales'
  };
}

// Mock implementation of validateTemplateCompatibility
export async function validateTemplateCompatibility(
  templateId: string,
  userMetrics: string[],
  supabase?: any
): Promise<{ compatible: boolean; missingMetrics: string[] }> {
  // This is a simplified implementation that just checks if 'deals_won' is in userMetrics
  // when templateId is 'template-1'
  if (userMetrics.includes('deals_won')) {
    return {
      compatible: true,
      missingMetrics: []
    };
  } else {
    return {
      compatible: false,
      missingMetrics: ['deals_won']
    };
  }
}

// Mock implementation of createDashboard
export async function createDashboard(
  params: CreateDashboardParams,
  supabase?: any
): Promise<Dashboard> {
  if (supabase) {
    // Use the provided Supabase client
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        title: params.title,
        description: params.description || '',
        config: params.config,
        user_id: 'test-user-id',
        team_id: params.team_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Default implementation if no Supabase client is provided
  return {
    id: 'dashboard-1',
    title: params.title,
    description: params.description || '',
    config: params.config,
    user_id: 'test-user-id',
    team_id: params.team_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Mock implementation of getDashboard
export async function getDashboard(
  id: string,
  supabase?: any
): Promise<Dashboard> {
  if (supabase) {
    // Use the provided Supabase client
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Default implementation if no Supabase client is provided
  return {
    id,
    title: 'Test Dashboard',
    description: 'A test dashboard',
    config: {
      metrics: [
        {
          id: 'metric-1',
          name: 'Total Activities',
          type: 'total',
          metrics: ['cold_calls', 'text_messages', 'facebook_dms'],
          displayType: 'number'
        }
      ],
      layout: [
        {
          id: 'row-1',
          order: 0,
          metrics: ['metric-1']
        }
      ]
    },
    user_id: 'test-user-id',
    team_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Mock implementation of updateDashboard
export async function updateDashboard(
  id: string,
  params: UpdateDashboardParams,
  supabase?: any
): Promise<Dashboard> {
  if (supabase) {
    // Use the provided Supabase client
    const updateData = {
      ...(params.title && { title: params.title }),
      ...(params.description !== undefined && { description: params.description }),
      ...(params.config && { config: params.config }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('dashboards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
  
  // Default implementation if no Supabase client is provided
  const dashboard = await getDashboard(id);
  
  return {
    ...dashboard,
    title: params.title || dashboard.title,
    description: params.description !== undefined ? params.description : dashboard.description,
    config: params.config || dashboard.config,
    updated_at: new Date().toISOString()
  };
}

// Mock implementation of cloneTemplate
export async function cloneTemplate(
  params: CloneTemplateParams,
  supabase?: any
): Promise<Dashboard> {
  const template = await getTemplate(params.template_id, supabase);
  
  return {
    id: 'cloned-dashboard-1',
    title: params.title || template.name,
    description: params.description || template.description,
    config: template.config,
    user_id: 'test-user-id',
    team_id: params.team_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
