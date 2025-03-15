import { supabase } from '@/lib/supabase';
import type {
  Dashboard,
  CreateDashboardParams,
  UpdateDashboardParams,
} from './types';

/**
 * Get all dashboards for the current user or their team
 */
export async function getDashboards(): Promise<Dashboard[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const user = userData.user;
  if (!user) throw new Error('User not authenticated');

  // Get user's dashboards
  const { data: userDashboards, error: userDashboardsError } = await supabase
    .from('dashboards')
    .select('*')
    .eq('user_id', user.id);

  if (userDashboardsError) throw userDashboardsError;

  // Get team dashboards (for all teams the user is a member of)
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .or(`user_id.eq.${user.id},team_members.cs.{${user.email}}`);

  if (teamError) throw teamError;

  const teamIds = teamData.map(team => team.id);
  
  let teamDashboards: any[] = [];
  if (teamIds.length > 0) {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .in('team_id', teamIds);
    
    if (error) throw error;
    teamDashboards = data || [];
  }

  // Combine user and team dashboards
  return [...userDashboards, ...teamDashboards];
}

/**
 * Get a specific dashboard by ID
 */
export async function getDashboard(id: string): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Create a new dashboard
 */
export async function createDashboard(params: CreateDashboardParams): Promise<Dashboard> {
  // If team_id is not provided, assign to current user
  if (!params.team_id) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        title: params.title,
        description: params.description,
        config: params.config,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Assign to team
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        title: params.title,
        description: params.description,
        config: params.config,
        team_id: params.team_id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Update an existing dashboard
 */
export async function updateDashboard(params: UpdateDashboardParams): Promise<Dashboard> {
  const updates: any = {};
  
  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined) updates.description = params.description;
  if (params.config !== undefined) updates.config = params.config;
  
  const { data, error } = await supabase
    .from('dashboards')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(id: string): Promise<void> {
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Convert the current metrics store state to a dashboard config
 */
export function convertMetricsStoreToConfig(
  definitions: any[],
  rows: any[]
): { metrics: any[], layout: any[] } {
  return {
    metrics: definitions.map(def => ({
      id: def.id,
      type: def.type,
      metrics: def.metrics,
      displayType: def.displayType,
      aggregation: def.aggregation,
      name: def.name,
      description: def.description
    })),
    layout: rows.map(row => ({
      rowId: row.id,
      metrics: row.metrics,
      order: row.order,
      height: row.height
    }))
  };
}
