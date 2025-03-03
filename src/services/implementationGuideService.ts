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
      
      // Validate inputs
      if (!projectId) {
        console.error('implementationGuideService: Missing project ID');
        throw new Error('Project ID is required');
      }

      if (!guide || !steps) {
        console.error('implementationGuideService: Missing guide or steps content');
        throw new Error('Guide and steps content are required');
      }

      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.warn('implementationGuideService: User not authenticated', userError);
        throw new Error('User not authenticated');
      }

      console.log('implementationGuideService: User authenticated, proceeding with upsert');
      
      // Check if the project exists first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        console.error('implementationGuideService: Project not found or not accessible', projectError);
        throw new Error(`Project not found or not accessible: ${projectError.message}`);
      }
      
      // Trim content if it's too large (Supabase may have limits)
      const maxContentLength = 100000; // Adjust based on your Supabase limits
      const trimmedGuide = guide.length > maxContentLength ? guide.substring(0, maxContentLength) : guide;
      const trimmedSteps = steps.length > maxContentLength ? steps.substring(0, maxContentLength) : steps;
      
      if (guide.length !== trimmedGuide.length || steps.length !== trimmedSteps.length) {
        console.warn('implementationGuideService: Content was trimmed due to size limits');
      }

      // First check if a guide already exists for this project
      const { data: existingGuide, error: existingGuideError } = await supabase
        .from('implementation_guides')
        .select('id')
        .eq('project_id', projectId)
        .single();
      
      if (existingGuideError) {
        console.log('implementationGuideService: No existing guide found or error checking:', existingGuideError);
      } else {
        console.log('implementationGuideService: Existing guide found with ID:', existingGuide.id);
      }
      
      let data, error;
      
      // If existingGuideError with code PGRST116, it means no rows were returned (guide doesn't exist)
      if (existingGuide && !existingGuideError) {
        // Update existing guide
        console.log('implementationGuideService: Updating existing guide for project:', projectId);
        const result = await supabase
          .from('implementation_guides')
          .update({
            implementation_guide: trimmedGuide,
            implementation_steps: trimmedSteps,
            using_mock: usingMock,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .select()
          .single();
          
        data = result.data;
        error = result.error;
      } else {
        // Insert new guide
        console.log('implementationGuideService: Creating new guide for project:', projectId);
        const result = await supabase
          .from('implementation_guides')
          .insert({
            project_id: projectId,
            implementation_guide: trimmedGuide,
            implementation_steps: trimmedSteps,
            using_mock: usingMock,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving guide:', error);
        // Provide more specific error messages based on error code
        if (error.code === '23505') {
          throw new Error('A guide already exists for this project. Please try again.');
        } else if (error.code === '23503') {
          throw new Error('The project does not exist or you do not have access to it.');
        } else if (error.code === '23502') {
          throw new Error('Required fields are missing. Please ensure all required fields are provided.');
        } else if (error.code === '42P10') {
          throw new Error('Database constraint error: There is no unique constraint on the specified column. This is likely a database schema issue.');
        } else {
          throw new Error(`Failed to save implementation guide: ${error.message}`);
        }
      }

      console.log('implementationGuideService: Guide saved successfully');
      return data;
    } catch (error) {
      console.error('Error in createOrUpdateGuide:', error);
      // Rethrow with more context for debugging
      if (error instanceof Error) {
        throw new Error(`Implementation guide creation failed: ${error.message}`);
      } else {
        throw new Error('Implementation guide creation failed due to an unknown error');
      }
    }
  },

  async getGuideByProjectId(projectId: string): Promise<ImplementationGuide | null> {
    try {
      console.log(`implementationGuideService.getGuideByProjectId: Fetching guide for project: ${projectId}`);
      
      if (!projectId) {
        console.error('implementationGuideService: Missing project ID');
        throw new Error('Project ID is required');
      }
      
      const { data, error } = await supabase
        .from('implementation_guides')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`implementationGuideService: No guide found for project: ${projectId}`);
          return null;
        }
        console.error('Error fetching guide:', error);
        throw new Error(`Failed to fetch implementation guide: ${error.message}`);
      }

      console.log('implementationGuideService: Guide found:', data);
      return data;
    } catch (error) {
      console.error('Error in getGuideByProjectId:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve implementation guide: ${error.message}`);
      } else {
        throw new Error('Failed to retrieve implementation guide due to an unknown error');
      }
    }
  }
}; 