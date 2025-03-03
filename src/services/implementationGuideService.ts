import { supabase } from '../lib/supabaseClient';

export interface ImplementationGuide {
  id: string;
  project_id: string;
  implementation_guide: string;
  implementation_steps: string;
  created_at: string;
  updated_at: string;
  using_mock: boolean;
}

export const implementationGuideService = {
  async createOrUpdateGuide(
    projectId: string,
    guide: string,
    steps: string,
    usingMock: boolean
  ): Promise<ImplementationGuide | null> {
    try {
      console.log('implementationGuideService.createOrUpdateGuide: Starting for project:', projectId);
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.warn('implementationGuideService: User not authenticated');
        throw new Error('User not authenticated');
      }

      // First check if a guide exists for this project
      const { data: existingGuide, error: fetchError } = await supabase
        .from('implementation_guides')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing guide:', fetchError);
        throw fetchError;
      }

      if (existingGuide) {
        console.log('implementationGuideService: Updating existing guide');
        const { data, error } = await supabase
          .from('implementation_guides')
          .update({
            implementation_guide: guide,
            implementation_steps: steps,
            using_mock: usingMock,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) {
          console.error('Error updating guide:', error);
          throw error;
        }
        console.log('implementationGuideService: Guide updated successfully');
        return data;
      } else {
        console.log('implementationGuideService: Creating new guide');
        const { data, error } = await supabase
          .from('implementation_guides')
          .insert({
            project_id: projectId,
            implementation_guide: guide,
            implementation_steps: steps,
            using_mock: usingMock
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating guide:', error);
          throw error;
        }
        console.log('implementationGuideService: Guide created successfully');
        return data;
      }
    } catch (error) {
      console.error('Error in createOrUpdateGuide:', error);
      throw error;
    }
  },

  async getGuideByProjectId(projectId: string): Promise<ImplementationGuide | null> {
    try {
      console.log(`implementationGuideService.getGuideByProjectId: Fetching guide for project: ${projectId}`);
      
      const { data, error } = await supabase
        .from('implementation_guides')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('implementationGuideService: No guide found for project');
          return null;
        }
        console.error('Error fetching guide:', error);
        throw error;
      }

      console.log('implementationGuideService: Guide found:', data);
      return data;
    } catch (error) {
      console.error('Error in getGuideByProjectId:', error);
      throw error;
    }
  }
}; 