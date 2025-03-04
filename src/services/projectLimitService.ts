import { supabase } from '../lib/supabaseClient';

export interface ProjectLimit {
  id: string;
  userId: string;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpgradeRequest {
  id: string;
  userId: string;
  userEmail: string;
  bestFeature?: string;
  worstFeature?: string;
  satisfaction?: number;
  additionalThoughts?: string;
  status?: string;
  createdAt: string;
}

export interface LimitStatus {
  canCreateProject: boolean;
  currentProjects: number;
  maxProjects: number;
}

export const projectLimitService = {
  /**
   * Get the project limit for the current user
   */
  async getUserProjectLimit(): Promise<ProjectLimit | null> {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return null;
      }

      // Check if user has a specific limit set
      const { data, error } = await supabase
        .from('project_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If the table doesn't exist (42P01 error), return a default limit
        if (error.code === '42P01') {
          console.warn('project_limits table does not exist, using default limit');
          return {
            id: 'default',
            userId: userId,
            maxProjects: 1, // Default limit
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        if (error.code === 'PGRST116') {
          // No record found, try to create one with default limit
          try {
            const defaultLimitResult = await supabase
              .from('admin_settings')
              .select('value')
              .eq('key', 'default_project_limit')
              .single();
            
            const defaultMaxProjects = defaultLimitResult.data?.value?.max_projects || 1;
            
            const newLimitResult = await supabase
              .from('project_limits')
              .insert({
                user_id: userId,
                max_projects: defaultMaxProjects
              })
              .select()
              .single();
            
            if (newLimitResult.error) {
              // If insert fails, still return a default limit
              if (newLimitResult.error.code === '42P01') {
                console.warn('project_limits table does not exist, using default limit');
                return {
                  id: 'default',
                  userId: userId,
                  maxProjects: 1, // Default limit
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
              }
              
              console.error('Error creating project limit:', newLimitResult.error);
              return {
                id: 'default',
                userId: userId,
                maxProjects: 1, // Default limit
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            
            return {
              id: newLimitResult.data.id,
              userId: newLimitResult.data.user_id,
              maxProjects: newLimitResult.data.max_projects,
              createdAt: newLimitResult.data.created_at,
              updatedAt: newLimitResult.data.updated_at
            };
          } catch (innerError) {
            console.error('Error handling default limit:', innerError);
            return {
              id: 'default',
              userId: userId,
              maxProjects: 1, // Default limit
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        }
        
        console.error('Error fetching project limit:', error);
        // Return a default limit instead of null to prevent navigation issues
        return {
          id: 'default',
          userId: userId,
          maxProjects: 1, // Default limit
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        maxProjects: data.max_projects,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error in getUserProjectLimit:', error);
      // Return a default limit instead of null
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id || 'unknown';
      
      return {
        id: 'default',
        userId: userId,
        maxProjects: 1, // Default limit
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },

  /**
   * Check if the user can create a new project
   */
  async checkCanCreateProject(): Promise<LimitStatus> {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return { 
          canCreateProject: false,
          currentProjects: 0,
          maxProjects: 0
        };
      }

      // Get user's project limit
      const limit = await this.getUserProjectLimit();
      const maxProjects = limit?.maxProjects || 1; // Default to 1 if no limit is found

      // Count user's active projects
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_archived', false);
      
      if (error) {
        console.error('Error counting projects:', error);
        // If the table doesn't exist, assume 0 projects
        if (error.code === '42P01') {
          console.warn('projects table does not exist, assuming 0 projects');
          return { 
            canCreateProject: true,
            currentProjects: 0,
            maxProjects
          };
        }
        
        return { 
          canCreateProject: true, // Default to allowing project creation
          currentProjects: 0,
          maxProjects
        };
      }

      const currentProjects = count || 0;

      return {
        canCreateProject: currentProjects < maxProjects,
        currentProjects,
        maxProjects
      };
    } catch (error) {
      console.error('Error in checkCanCreateProject:', error);
      return { 
        canCreateProject: true, // Default to allowing project creation
        currentProjects: 0,
        maxProjects: 1 
      };
    }
  },
  
  /**
   * Submit an upgrade request
   */
  async submitUpgradeRequest(
    bestFeature?: string,
    worstFeature?: string,
    satisfaction?: number,
    additionalFeedback?: string
  ): Promise<boolean> {
    try {
      // Get the current user session
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const userEmail = userData.user?.email;
      
      if (!userId || !userEmail) {
        console.error('No authenticated user found');
        return false;
      }

      // Check if user already has a pending request
      const { data: existingRequests } = await supabase
        .from('upgrade_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending');
      
      if (existingRequests && existingRequests.length > 0) {
        console.log('User already has a pending upgrade request');
        return true; // Return true to avoid showing error to user
      }

      // Insert the upgrade request
      const { error } = await supabase
        .from('upgrade_requests')
        .insert({
          user_id: userId,
          user_email: userEmail,
          best_feature: bestFeature,
          worst_feature: worstFeature,
          satisfaction: satisfaction || 5, // Ensure satisfaction has a default value
          additional_thoughts: additionalFeedback, // Use additional_thoughts instead of additional_feedback
          status: 'pending' // Explicitly set status to pending
        });
      
      if (error) {
        console.error('Error submitting upgrade request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitUpgradeRequest:', error);
      return false;
    }
  },

  /**
   * Get all upgrade requests (admin only)
   */
  async getUpgradeRequests(): Promise<UpgradeRequest[]> {
    try {
      const { data, error } = await supabase
        .from('upgrade_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching upgrade requests:', error);
        return [];
      }

      return data.map(request => ({
        id: request.id,
        userId: request.user_id,
        userEmail: request.user_email,
        bestFeature: request.best_feature,
        worstFeature: request.worst_feature,
        satisfaction: request.satisfaction,
        additionalThoughts: request.additional_thoughts,
        status: request.status || 'pending',
        createdAt: request.created_at
      }));
    } catch (error) {
      console.error('Error in getUpgradeRequests:', error);
      return [];
    }
  },

  /**
   * Update a user's project limit (admin only)
   */
  async updateUserProjectLimit(userId: string, maxProjects: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_limits')
        .upsert({
          user_id: userId,
          max_projects: maxProjects,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating project limit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProjectLimit:', error);
      return false;
    }
  },

  /**
   * Update the default project limit (admin only)
   */
  async updateDefaultProjectLimit(maxProjects: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'default_project_limit',
          value: { max_projects: maxProjects },
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating default project limit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateDefaultProjectLimit:', error);
      return false;
    }
  },

  /**
   * Update the status of an upgrade request (admin only)
   */
  async updateUpgradeRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('upgrade_requests')
        .update({ status })
        .eq('id', requestId);
      
      if (error) {
        console.error(`Error updating upgrade request status to ${status}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error in updateUpgradeRequestStatus to ${status}:`, error);
      return false;
    }
  }
}; 