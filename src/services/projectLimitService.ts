import { supabase } from '../lib/supabaseClient';

export interface ProjectLimit {
  id: string;
  userId: string;
  maxProjects: number;
  maxPrioritizedFeatures: number;
  planId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  defaultProjectLimit: number;
  defaultPrioritizedFeaturesLimit: number;
  enablesSvgWireframes: boolean;
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
  planName?: string;
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
        .select(`
          *,
          plans:plan_id (*)
        `)
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
            maxPrioritizedFeatures: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        if (error.code === 'PGRST116') {
          // No record found, try to create one with default Free plan
          try {
            // Find the Free plan - use correct case
            const { data: freePlan, error: planError } = await supabase
              .from('plans')
              .select('*')
              .eq('name', 'Free')
              .single();
            
            if (planError) {
              console.error('Error finding Free plan:', planError);
              return {
                id: 'default',
                userId: userId,
                maxProjects: 1, // Default limit
                maxPrioritizedFeatures: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            
            if (!freePlan) {
              console.error('Free plan not found');
              return {
                id: 'default',
                userId: userId,
                maxProjects: 1, // Default limit
                maxPrioritizedFeatures: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            
            const defaultMaxProjects = freePlan.default_project_limit || 1;
            const planId = freePlan.id;
            
            console.log(`Creating project limit for user ${userId} with Free plan (${planId})`);
            
            const newLimitResult = await supabase
              .from('project_limits')
              .insert({
                user_id: userId,
                max_projects: defaultMaxProjects,
                plan_id: planId
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
                  maxPrioritizedFeatures: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
              }
              
              console.error('Error creating project limit:', newLimitResult.error);
              return {
                id: 'default',
                userId: userId,
                maxProjects: 1, // Default limit
                maxPrioritizedFeatures: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            
            console.log(`Successfully created project limit for user ${userId}`);
            
            return {
              id: newLimitResult.data.id,
              userId: newLimitResult.data.user_id,
              maxProjects: newLimitResult.data.max_projects,
              maxPrioritizedFeatures: newLimitResult.data.max_prioritized_features,
              planId: newLimitResult.data.plan_id,
              createdAt: newLimitResult.data.created_at,
              updatedAt: newLimitResult.data.updated_at
            };
          } catch (innerError) {
            console.error('Error handling default limit:', innerError);
            return {
              id: 'default',
              userId: userId,
              maxProjects: 1, // Default limit
              maxPrioritizedFeatures: 0,
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
          maxPrioritizedFeatures: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        maxProjects: data.max_projects,
        maxPrioritizedFeatures: data.max_prioritized_features,
        planId: data.plan_id,
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
        maxPrioritizedFeatures: 0,
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

      // Get user's project limit with plan information
      const { data: limitData, error: limitError } = await supabase
        .from('project_limits')
        .select(`
          *,
          plans:plan_id (*)
        `)
        .eq('user_id', userId)
        .single();

      let maxProjects = 1; // Default to 1 if no limit is found
      let planName: string | undefined = undefined;

      // Handle case where user doesn't have a project_limits entry
      if (limitError && limitError.code === 'PGRST116') { // PGRST116 is "Not Found" error
        console.log('No project limit found for user. Creating one with Free plan...');
        
        try {
          // Get the Free plan - make sure to use the case-sensitive name "Free"
          const { data: freePlan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('name', 'Free')
            .single();
            
          if (planError) {
            console.error('Error getting Free plan:', planError);
            // Continue with default values
          } else if (freePlan) {
            maxProjects = freePlan.default_project_limit;
            planName = freePlan.name;
            
            // Create a project_limits entry for this user with the Free plan
            const { error: insertError } = await supabase
              .from('project_limits')
              .insert({
                user_id: userId,
                max_projects: maxProjects,
                plan_id: freePlan.id,
                max_prioritized_features: freePlan.default_prioritized_features_limit || 2
              });
              
            if (insertError) {
              console.error('Error creating project limit for new user:', insertError);
            } else {
              console.log('Successfully created project limit for user:', userId);
            }
          } else {
            console.error('Free plan not found');
          }
        } catch (error) {
          console.error('Error creating project limit for user:', error);
        }
      } else if (limitError) {
        // Handle other types of errors
        console.error('Error fetching project limit:', limitError);
      } else if (limitData) {
        // User has a project_limits entry, use those values
        maxProjects = limitData.max_projects;
        if (limitData.plans) {
          planName = limitData.plans.name;
        }
      }

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
            maxProjects,
            planName
          };
        }
        
        return { 
          canCreateProject: true, // Default to allowing project creation
          currentProjects: 0,
          maxProjects,
          planName
        };
      }

      const currentProjects = count || 0;

      return {
        canCreateProject: currentProjects < maxProjects,
        currentProjects,
        maxProjects,
        planName
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
   * Get user's project limit and plan
   */
  async getUserProjectLimitAndPlan(userId: string): Promise<{ limit: ProjectLimit | null, plan: Plan | null }> {
    try {
      // Get user's project limit with plan information
      const { data, error } = await supabase
        .from('project_limits')
        .select(`
          *,
          plans:plan_id (*)
        `)
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Not found error
          console.log(`No project limit found for user ${userId}. Creating one with Free plan...`);
          
          try {
            // Find the Free plan
            const { data: freePlan, error: planError } = await supabase
              .from('plans')
              .select('*')
              .eq('name', 'Free')
              .single();
              
            if (planError || !freePlan) {
              console.error('Free plan not found:', planError);
              return { limit: null, plan: null };
            }
            
            // Create a new project_limits entry
            const { data: newLimit, error: insertError } = await supabase
              .from('project_limits')
              .insert({
                user_id: userId,
                max_projects: freePlan.default_project_limit,
                plan_id: freePlan.id,
                max_prioritized_features: freePlan.default_prioritized_features_limit || 2
              })
              .select(`*, plans:plan_id(*)`)
              .single();
              
            if (insertError || !newLimit) {
              console.error('Error creating project limit:', insertError);
              return { limit: null, plan: null };
            }
            
            console.log(`Successfully created project limit for user ${userId}`);
            
            return {
              limit: {
                id: newLimit.id,
                userId: newLimit.user_id,
                maxProjects: newLimit.max_projects,
                maxPrioritizedFeatures: newLimit.max_prioritized_features,
                planId: newLimit.plan_id,
                createdAt: newLimit.created_at,
                updatedAt: newLimit.updated_at
              },
              plan: newLimit.plans ? {
                id: newLimit.plans.id,
                name: newLimit.plans.name,
                description: newLimit.plans.description,
                defaultProjectLimit: newLimit.plans.default_project_limit,
                defaultPrioritizedFeaturesLimit: newLimit.plans.default_prioritized_features_limit,
                enablesSvgWireframes: !!newLimit.plans.enables_svg_wireframes,
                createdAt: newLimit.plans.created_at,
                updatedAt: newLimit.plans.updated_at
              } : null
            };
          } catch (createError) {
            console.error('Error creating project limit:', createError);
            return { limit: null, plan: null };
          }
        } else {
          console.error('Error getting user project limit and plan:', error);
          return { limit: null, plan: null };
        }
      }
      
      if (!data) return { limit: null, plan: null };
      
      return {
        limit: {
          id: data.id,
          userId: data.user_id,
          maxProjects: data.max_projects,
          maxPrioritizedFeatures: data.max_prioritized_features,
          planId: data.plan_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        },
        plan: data.plans ? {
          id: data.plans.id,
          name: data.plans.name,
          description: data.plans.description,
          defaultProjectLimit: data.plans.default_project_limit,
          defaultPrioritizedFeaturesLimit: data.plans.default_prioritized_features_limit,
          enablesSvgWireframes: !!data.plans.enables_svg_wireframes,
          createdAt: data.plans.created_at,
          updatedAt: data.plans.updated_at
        } : null
      };
    } catch (error) {
      console.error('Error getting user project limit and plan:', error);
      return { limit: null, plan: null };
    }
  },
  
  /**
   * Get all available plans
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('id');
        
      if (error) {
        console.error('Error getting plans:', error);
        return [];
      }
      
      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        defaultProjectLimit: plan.default_project_limit,
        defaultPrioritizedFeaturesLimit: plan.default_prioritized_features_limit,
        enablesSvgWireframes: !!plan.enables_svg_wireframes,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at
      }));
    } catch (error) {
      console.error('Error getting plans:', error);
      return [];
    }
  },
  
  /**
   * Update user's plan
   */
  async updateUserPlan(userId: string, planId: number): Promise<boolean> {
    try {
      // Get plan details first to know the default project limit
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (planError || !plan) {
        console.error('Plan not found:', planError);
        return false;
      }
      
      console.log(`Updating user ${userId} to plan: ${plan.name} (ID: ${planId})`);
      
      // Check if user has a project limit entry
      const { data: existingLimit, error: limitError } = await supabase
        .from('project_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (limitError && limitError.code !== 'PGRST116') {
        console.error('Error checking for existing limit:', limitError);
        return false;
      }
      
      if (existingLimit) {
        // Update existing entry with new plan and limit
        const { error: updateError } = await supabase
          .from('project_limits')
          .update({
            plan_id: planId,
            max_projects: plan.default_project_limit,
            max_prioritized_features: plan.default_prioritized_features_limit || (plan.name === 'Free' ? 2 : -1),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error('Error updating project limit:', updateError);
          return false;
        }
        
        console.log(`Successfully updated project limit for user ${userId} to plan ${plan.name}`);
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('project_limits')
          .insert({
            user_id: userId,
            plan_id: planId,
            max_projects: plan.default_project_limit,
            max_prioritized_features: plan.default_prioritized_features_limit || (plan.name === 'Free' ? 2 : -1)
          });
          
        if (insertError) {
          console.error('Error creating project limit:', insertError);
          return false;
        }
        
        console.log(`Successfully created project limit for user ${userId} with plan ${plan.name}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user plan:', error);
      return false;
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
      // Check if the user has an existing project limit entry
      const { data: existingLimit, error: limitError } = await supabase
        .from('project_limits')
        .select('*, plans:plan_id(*)')
        .eq('user_id', userId)
        .single();
      
      if (limitError && limitError.code !== 'PGRST116') {
        console.error('Error checking existing project limit:', limitError);
        return false;
      }

      if (existingLimit) {
        // Update the existing limit while preserving the plan_id
        const { error: updateError } = await supabase
          .from('project_limits')
          .update({
            max_projects: maxProjects,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating project limit:', updateError);
          return false;
        }
        
        console.log(`Successfully updated project limit for user ${userId} to ${maxProjects}`);
        return true;
      } else {
        // No existing limit found, try to get the Free plan
        const { data: freePlan, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('name', 'Free')
          .single();
        
        if (planError || !freePlan) {
          console.error('Error getting Free plan:', planError);
          return false;
        }
        
        // Create a new project_limits entry with the Free plan
        const { error: insertError } = await supabase
          .from('project_limits')
          .insert({
            user_id: userId,
            max_projects: maxProjects,
            plan_id: freePlan.id,
            max_prioritized_features: freePlan.default_prioritized_features_limit || 2
          });
        
        if (insertError) {
          console.error('Error creating project limit:', insertError);
          return false;
        }
        
        console.log(`Successfully created project limit for user ${userId} with max projects ${maxProjects}`);
      return true;
      }
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
  },

  /**
   * Check if the user can generate SVG wireframes based on their plan
   */
  async canGenerateSvgWireframes(): Promise<boolean> {
    try {
      // Get the current user
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return false;
      }

      // First try to use the RPC function if available
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('check_svg_wireframes_access');
        
        if (!rpcError && rpcResult !== null) {
          return !!rpcResult;
        }
      } catch (rpcError) {
        console.warn('RPC function check_svg_wireframes_access failed, falling back to manual check');
      }
      
      // Fallback: Get user's project limit with plan information
      const { limit, plan } = await this.getUserProjectLimitAndPlan(userId);
      
      // If no plan found or plan doesn't enable SVG wireframes, return false
      if (!plan || !plan.enablesSvgWireframes) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking SVG wireframes access:', error);
      return false;
    }
  }
}; 