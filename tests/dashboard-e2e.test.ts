import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  convertMetricsStoreToConfig,
  createTemplate, 
  getTemplate, 
  cloneTemplate,
  createDashboard, 
  getDashboard, 
  updateDashboard 
} from './mocks/dashboard-api';
import type { 
  MetricDefinition, 
  DashboardConfig, 
  CreateTemplateParams,
  Dashboard,
  DashboardTemplate
} from './mocks/types';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      }))
    }
  }))
}));

describe('Dashboard E2E Flow Tests', () => {
  // Sample store data
  const storeMetricDefinitions: MetricDefinition[] = [
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
  ];

  const storeRows = [
    {
      id: 'row-1',
      order: 0,
      metrics: ['metric-1', 'metric-2']
    }
  ];

  let mockSupabase: any;
  let dashboardId: string;
  let templateId: string;
  let dashboardData: Dashboard;
  let templateData: DashboardTemplate;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup IDs for our test
    dashboardId = 'dashboard-1';
    templateId = 'template-1';
    
    // Convert store data to config
    const config = convertMetricsStoreToConfig(storeMetricDefinitions, storeRows);
    
    // Setup mock dashboard data
    dashboardData = {
      id: dashboardId,
      title: 'Test Dashboard',
      description: 'A test dashboard',
      config,
      user_id: 'test-user-id',
      team_id: null,
      created_at: '2025-03-14T20:00:00Z',
      updated_at: '2025-03-14T20:00:00Z'
    };
    
    // Setup mock template data
    templateData = {
      id: templateId,
      name: 'Test Template',
      description: 'A test template',
      config,
      visibility: 'private',
      owner_id: 'test-user-id',
      created_at: '2025-03-14T20:00:00Z',
      updated_at: '2025-03-14T20:00:00Z',
      downloads_count: 0,
      category: 'Sales'
    };
    
    // Setup mock Supabase client
    mockSupabase = createClient('https://example.com', 'fake-key');
    
    // Mock dashboard operations
    const dashboardInsertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: dashboardData,
          error: null
        })
      })
    });
    
    const dashboardSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: dashboardData,
          error: null
        })
      })
    });
    
    const dashboardUpdateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: dashboardData,
            error: null
          })
        })
      })
    });
    
    // Mock template operations
    const templateInsertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: templateData,
          error: null
        })
      })
    });
    
    const templateSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: templateData,
          error: null
        })
      })
    });
    
    // Setup from mock to return different mocks based on the table
    mockSupabase.from = vi.fn((table) => {
      if (table === 'dashboards') {
        return {
          insert: dashboardInsertMock,
          select: dashboardSelectMock,
          update: dashboardUpdateMock
        };
      } else if (table === 'dashboard_templates') {
        return {
          insert: templateInsertMock,
          select: templateSelectMock
        };
      }
      return {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn()
      };
    });
  });

  it('should perform a full cycle: store → DB → store for dashboards', async () => {
    // Setup mock data
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: dashboardData,
          error: null
        })
      })
    });
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });
    
    // 1. Create a dashboard from store data
    const dashboardParams: CreateDashboardParams = {
      title: 'Test Dashboard',
      description: 'A test dashboard',
      config: convertMetricsStoreToConfig(storeMetricDefinitions, storeRows),
      team_id: null
    };
    
    const createdDashboard = await createDashboard(dashboardParams, mockSupabase);
    
    // Verify dashboard was created with correct config
    expect(createdDashboard).toMatchObject({
      id: 'dashboard-1',
      title: 'Test Dashboard',
      description: 'A test dashboard',
      config: expect.objectContaining({
        metrics: expect.arrayContaining([
          expect.objectContaining({
            id: 'metric-1',
            name: 'Total Activities'
          })
        ])
      }),
      user_id: 'test-user-id'
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('dashboards');
    
    // The first argument to insert should contain our config
    const insertArg = insertMock.mock.calls[0][0];
    expect(insertArg.config).toEqual(convertMetricsStoreToConfig(storeMetricDefinitions, storeRows));
    
    // 2. Retrieve the dashboard from DB
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: dashboardData,
          error: null
        })
      })
    });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectMock });
    
    const retrievedDashboard = await getDashboard('dashboard-1', mockSupabase);
    
    // Verify retrieved dashboard has correct structure
    expect(retrievedDashboard).toMatchObject({
      id: 'dashboard-1',
      title: 'Test Dashboard',
      config: expect.objectContaining({
        metrics: expect.any(Array),
        layout: expect.any(Array)
      })
    });
    
    // 3. Update the dashboard
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...dashboardData,
              title: 'Updated Dashboard',
              updated_at: new Date().toISOString()
            },
            error: null
          })
        })
      })
    });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateMock });
    
    const updatedDashboard = await updateDashboard('dashboard-1', {
      title: 'Updated Dashboard'
    }, mockSupabase);
    
    // Verify dashboard was updated
    expect(updatedDashboard.title).toBe('Updated Dashboard');
    expect(updatedDashboard.config).toEqual(dashboardData.config);
  });

  it('should perform a full cycle: dashboard → template → new dashboard', async () => {
    // Step 1: Create a template from dashboard config
    const config = convertMetricsStoreToConfig(storeMetricDefinitions, storeRows);
    
    const templateParams: CreateTemplateParams = {
      name: 'Test Template',
      description: 'A test template',
      config,
      visibility: 'private',
      category: 'Sales',
      dashboard_id: dashboardId
    };
    
    const createdTemplate = await createTemplate(templateParams, mockSupabase);
    
    // Verify template was created with correct config
    expect(createdTemplate).toEqual(templateData);
    expect(mockSupabase.from).toHaveBeenCalledWith('dashboard_templates');
    
    // Step 2: Retrieve the template
    const retrievedTemplate = await getTemplate(templateId, mockSupabase);
    
    // Verify template was retrieved with correct config
    expect(retrievedTemplate).toEqual(templateData);
    
    // Step 3: Clone the template to create a new dashboard
    // Update the mock to return a new dashboard when cloning
    const clonedDashboardData = {
      ...dashboardData,
      id: 'cloned-dashboard-1',
      title: 'Cloned Dashboard',
      description: 'A cloned dashboard'
    };
    
    mockSupabase.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: clonedDashboardData,
            error: null
          })
        })
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: templateData,
            error: null
          })
        })
      })
    });
    
    const clonedDashboard = await cloneTemplate({
      template_id: templateId,
      title: 'Cloned Dashboard',
      description: 'A cloned dashboard'
    }, mockSupabase);
    
    // Verify the cloned dashboard has the correct config
    expect(clonedDashboard.id).toBe('cloned-dashboard-1');
    expect(clonedDashboard.title).toBe('Cloned Dashboard');
    expect(clonedDashboard.config.metrics).toHaveLength(storeMetricDefinitions.length);
    
    // Verify the metrics were preserved in the cloning process
    const clonedMetric1 = clonedDashboard.config.metrics.find(m => m.id === 'metric-1');
    const clonedMetric2 = clonedDashboard.config.metrics.find(m => m.id === 'metric-2');
    
    expect(clonedMetric1).toBeDefined();
    expect(clonedMetric1?.name).toBe('Total Activities');
    
    expect(clonedMetric2).toBeDefined();
    expect(clonedMetric2?.type).toBe('conversion');
  });
});
