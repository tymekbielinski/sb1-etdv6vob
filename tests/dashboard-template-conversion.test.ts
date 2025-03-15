import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  convertMetricsStoreToConfig,
  createTemplate, 
  getTemplate,
  validateTemplateCompatibility
} from './mocks/dashboard-api';
import type { 
  MetricDefinition, 
  DashboardConfig, 
  CreateTemplateParams 
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

describe('Dashboard Template Conversion Tests', () => {
  // Sample metric definitions that would come from the store
  const sampleMetricDefinitions: MetricDefinition[] = [
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

  // Sample layout rows from the store
  const sampleRows = [
    {
      id: 'row-1',
      order: 0,
      metrics: ['metric-1', 'metric-2']
    }
  ];

  // Expected dashboard config after conversion
  const expectedConfig: DashboardConfig = {
    metrics: sampleMetricDefinitions,
    layout: sampleRows
  };

  // Mock template data that would be returned from the database
  const mockTemplateData = {
    id: 'template-1',
    name: 'Test Template',
    description: 'A test template',
    config: expectedConfig,
    visibility: 'private',
    owner_id: 'test-user-id',
    created_at: '2025-03-14T20:00:00Z',
    updated_at: '2025-03-14T20:00:00Z',
    downloads_count: 0,
    category: 'Sales'
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Setup mock return values
    const mockClient = createClient('https://example.com', 'fake-key');
    
    // Mock template creation
    mockClient.from('dashboard_templates').insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockTemplateData,
          error: null
        })
      })
    });
    
    // Mock template retrieval
    mockClient.from('dashboard_templates').select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockTemplateData,
          error: null
        })
      })
    });
  });

  it('should correctly convert metrics store data to dashboard config', () => {
    // Test the conversion function
    const result = convertMetricsStoreToConfig(sampleMetricDefinitions, sampleRows);
    
    // Verify the conversion is correct
    expect(result).toEqual(expectedConfig);
    expect(result.metrics).toHaveLength(2);
    expect(result.layout).toHaveLength(1);
    
    // Check specific values
    expect(result.metrics[0].name).toBe('Total Activities');
    expect(result.metrics[1].type).toBe('conversion');
    expect(result.layout[0].metrics).toContain('metric-1');
  });

  it('should create a template and store the correct config format', async () => {
    // Setup mock for createTemplate
    const mockSupabase = createClient('https://example.com', 'fake-key');
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockTemplateData,
          error: null
        })
      })
    });
    mockSupabase.from = vi.fn().mockReturnValue({ insert: insertMock });
    
    // Create template params
    const templateParams: CreateTemplateParams = {
      name: 'Test Template',
      description: 'A test template',
      config: expectedConfig,
      visibility: 'private',
      category: 'Sales'
    };
    
    // Call the function with our mocked client
    const result = await createTemplate(templateParams, mockSupabase);
    
    // Verify the template was created with the correct config
    expect(result).toMatchObject({
      id: 'template-1',
      name: 'Test Template',
      description: 'A test template',
      config: expect.objectContaining({
        metrics: expect.arrayContaining([
          expect.objectContaining({
            id: 'metric-1',
            name: 'Total Activities'
          })
        ])
      }),
      visibility: 'private',
      category: 'Sales'
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('dashboard_templates');
    expect(insertMock).toHaveBeenCalled();
    
    // The first argument to insert should contain our config
    const insertArg = insertMock.mock.calls[0][0];
    expect(insertArg.config).toEqual(expectedConfig);
  });

  it('should retrieve a template and correctly parse the config', async () => {
    // Setup mock for getTemplate
    const mockSupabase = createClient('https://example.com', 'fake-key');
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockTemplateData,
          error: null
        })
      })
    });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectMock });
    
    // Call the function with our mocked client
    const result = await getTemplate('template-1', mockSupabase);
    
    // Verify the template was retrieved and the config is correct
    expect(result).toMatchObject({
      id: 'template-1',
      name: 'Test Template',
      config: expect.objectContaining({
        metrics: expect.any(Array),
        layout: expect.any(Array)
      })
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('dashboard_templates');
    expect(selectMock).toHaveBeenCalled();
    
    // Check that the config structure is preserved
    expect(result.config.metrics.length).toBeGreaterThan(0);
    expect(result.config.layout.length).toBeGreaterThan(0);
  });

  it('should validate template compatibility correctly', async () => {
    // Setup mock data for compatibility check
    const userMetrics = ['cold_calls', 'text_messages', 'facebook_dms', 'deals_won'];
    const incompatibleUserMetrics = ['cold_calls', 'text_messages']; // Missing deals_won
    
    // Mock the template with metrics that require specific user metrics
    const compatibleTemplate = {
      ...mockTemplateData,
      config: {
        metrics: [
          {
            id: 'metric-1',
            name: 'Total Activities',
            type: 'total',
            metrics: ['cold_calls', 'text_messages'],
            displayType: 'number'
          }
        ],
        layout: sampleRows
      }
    };
    
    const incompatibleTemplate = {
      ...mockTemplateData,
      config: {
        metrics: [
          {
            id: 'metric-2',
            name: 'Conversion Rate',
            type: 'conversion',
            metrics: ['cold_calls', 'deals_won'],
            displayType: 'percentage'
          }
        ],
        layout: sampleRows
      }
    };
    
    // Setup mock for getTemplate
    const mockSupabase = createClient('https://example.com', 'fake-key');
    
    // Test 1: Compatible template
    const mockGetTemplate = vi.fn()
      .mockImplementationOnce(() => Promise.resolve(compatibleTemplate))
      .mockImplementationOnce(() => Promise.resolve(incompatibleTemplate));
    
    // Override the getTemplate function for this test
    vi.spyOn(await import('./mocks/dashboard-api'), 'getTemplate').mockImplementation(mockGetTemplate);
    
    const compatibleResult = await validateTemplateCompatibility(
      'template-1', 
      userMetrics,
      mockSupabase
    );
    
    expect(compatibleResult.compatible).toBe(true);
    expect(compatibleResult.missingMetrics).toHaveLength(0);
    
    // Test 2: Incompatible template
    const incompatibleResult = await validateTemplateCompatibility(
      'template-1', 
      incompatibleUserMetrics,
      mockSupabase
    );
    
    expect(incompatibleResult.compatible).toBe(false);
    // Check if missingMetrics contains at least one item
    expect(incompatibleResult.missingMetrics.length).toBeGreaterThan(0);
  });
});
