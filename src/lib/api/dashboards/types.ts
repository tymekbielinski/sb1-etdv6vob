import type { MetricDefinition } from '@/lib/store/metrics-store';

export interface DashboardConfig {
  metrics: MetricDefinition[];
  layout: {
    rowId: string;
    metrics: string[]; // Array of metric IDs
    order?: number;
    height?: number;
  }[];
  activities?: string[]; // Store selected activities
  charts?: any[]; // Store chart configurations
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  config: DashboardConfig;
  user_id?: string;
  team_id?: string;
  is_home: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  config: DashboardConfig;
  category?: string;
  visibility: 'private' | 'public';
  owner_id: string;
  downloads_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardParams {
  title: string;
  description?: string;
  config: DashboardConfig;
  team_id?: string; // If not provided, will be assigned to current user
  is_home?: boolean; // Set to true to make this the home dashboard
}

export interface UpdateDashboardParams {
  id: string;
  title?: string;
  description?: string;
  config?: DashboardConfig;
  is_home?: boolean; // Set to true to make this the home dashboard
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  config: DashboardConfig;
  category?: string;
  visibility?: 'private' | 'public';
  dashboard_id?: string; // If provided, will convert existing dashboard to template
}

export interface UpdateTemplateParams {
  id: string;
  name?: string;
  description?: string;
  config?: DashboardConfig;
  category?: string;
  visibility?: 'private' | 'public';
}

export interface CloneTemplateParams {
  template_id: string;
  title?: string;
  description?: string;
  team_id?: string; // If not provided, will be assigned to current user
}
