// Mock types for testing
export interface MetricDefinition {
  id: string;
  name: string;
  type: 'total' | 'conversion';
  metrics: string[];
  displayType: 'number' | 'percentage' | 'currency';
}

export interface DashboardConfig {
  metrics: MetricDefinition[];
  layout: {
    id: string;
    order: number;
    metrics: string[];
  }[];
}

export interface Dashboard {
  id: string;
  title: string;
  description: string;
  config: DashboardConfig;
  user_id: string;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  config: DashboardConfig;
  visibility: 'public' | 'private';
  owner_id: string;
  created_at: string;
  updated_at: string;
  downloads_count: number;
  category?: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  config: DashboardConfig;
  visibility?: 'public' | 'private';
  category?: string;
  dashboard_id?: string;
}

export interface CreateDashboardParams {
  title: string;
  description?: string;
  config: DashboardConfig;
  team_id?: string;
}

export interface UpdateDashboardParams {
  title?: string;
  description?: string;
  config?: DashboardConfig;
}

export interface CloneTemplateParams {
  template_id: string;
  title?: string;
  description?: string;
  team_id?: string;
}
