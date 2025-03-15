import { create } from 'zustand';
import { 
  getTemplates, 
  getPublicTemplates, 
  getTemplate, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  cloneTemplate,
  validateTemplateCompatibility
} from '@/lib/api/dashboards/templates';
import type { 
  DashboardTemplate, 
  CreateTemplateParams, 
  UpdateTemplateParams,
  CloneTemplateParams,
  Dashboard
} from '@/lib/api/dashboards/types';

interface TemplatesState {
  templates: DashboardTemplate[];
  publicTemplates: DashboardTemplate[];
  currentTemplate: DashboardTemplate | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  fetchPublicTemplates: () => Promise<void>;
  fetchTemplate: (id: string) => Promise<void>;
  createTemplate: (params: CreateTemplateParams) => Promise<DashboardTemplate>;
  updateTemplate: (params: UpdateTemplateParams) => Promise<DashboardTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  cloneTemplate: (params: CloneTemplateParams) => Promise<Dashboard>;
  validateTemplateCompatibility: (templateId: string) => Promise<{
    compatible: boolean;
    missingMetrics: string[];
  }>;
  setCurrentTemplate: (template: DashboardTemplate | null) => void;
  reset: () => void;
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  publicTemplates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,
  
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await getTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      console.error('Error fetching templates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch templates', 
        isLoading: false 
      });
    }
  },
  
  fetchPublicTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const publicTemplates = await getPublicTemplates();
      set({ publicTemplates, isLoading: false });
    } catch (error) {
      console.error('Error fetching public templates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch public templates', 
        isLoading: false 
      });
    }
  },
  
  fetchTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const template = await getTemplate(id);
      set({ currentTemplate: template, isLoading: false });
    } catch (error) {
      console.error('Error fetching template:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch template', 
        isLoading: false 
      });
    }
  },
  
  createTemplate: async (params: CreateTemplateParams) => {
    set({ isLoading: true, error: null });
    try {
      const template = await createTemplate(params);
      set(state => ({ 
        templates: [...state.templates, template],
        currentTemplate: template,
        isLoading: false 
      }));
      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create template', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTemplate: async (params: UpdateTemplateParams) => {
    set({ isLoading: true, error: null });
    try {
      const template = await updateTemplate(params);
      set(state => ({ 
        templates: state.templates.map(t => t.id === template.id ? template : t),
        publicTemplates: state.publicTemplates.map(t => t.id === template.id ? template : t),
        currentTemplate: state.currentTemplate?.id === template.id ? template : state.currentTemplate,
        isLoading: false 
      }));
      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update template', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTemplate(id);
      set(state => ({ 
        templates: state.templates.filter(t => t.id !== id),
        publicTemplates: state.publicTemplates.filter(t => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error deleting template:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete template', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  cloneTemplate: async (params: CloneTemplateParams) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await cloneTemplate(params);
      set({ isLoading: false });
      return dashboard;
    } catch (error) {
      console.error('Error cloning template:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to clone template', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  validateTemplateCompatibility: async (templateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await validateTemplateCompatibility(templateId);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error validating template compatibility:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to validate template compatibility', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setCurrentTemplate: (template: DashboardTemplate | null) => {
    set({ currentTemplate: template });
  },
  
  reset: () => {
    set({ 
      templates: [],
      publicTemplates: [],
      currentTemplate: null,
      isLoading: false,
      error: null
    });
  }
}));
