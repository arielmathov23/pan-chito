import { supabase } from '../lib/supabaseClient';

export interface Feedback {
  id: string;
  user_id: string;
  project_id: string;
  best_feature: string;
  worst_feature: string;
  satisfaction_rating: number;
  additional_thoughts?: string;
  created_at: string;
  updated_at: string;
}

export const feedbackService = {
  async submitFeedback(
    projectId: string,
    bestFeature: string,
    worstFeature: string,
    satisfactionRating: number,
    additionalThoughts?: string
  ): Promise<Feedback | null> {
    try {
      console.log('feedbackService.submitFeedback: Starting for project:', projectId);
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.warn('feedbackService: User not authenticated');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          best_feature: bestFeature,
          worst_feature: worstFeature,
          satisfaction_rating: satisfactionRating,
          additional_thoughts: additionalThoughts
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }

      console.log('feedbackService: Feedback submitted successfully');
      return data;
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      throw error;
    }
  },

  async getFeedbackByProjectId(projectId: string): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeedbackByProjectId:', error);
      throw error;
    }
  },

  /**
   * Check if the current user has already submitted feedback
   */
  async hasUserSubmittedFeedback(): Promise<boolean> {
    try {
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.warn('feedbackService: User not authenticated');
        return false;
      }

      // Check if user has submitted any feedback
      const { count, error } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error checking user feedback:', error);
        return false;
      }

      return count !== null && count > 0;
    } catch (error) {
      console.error('Error in hasUserSubmittedFeedback:', error);
      return false;
    }
  }
}; 