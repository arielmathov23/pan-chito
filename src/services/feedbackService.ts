import { supabase } from '../lib/supabaseClient';

export interface Feedback {
  id: string;
  user_id: string;
  project_id: string;
  feedback_type: string;
  rating: number;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export const feedbackService = {
  async submitFeedback(
    projectId: string,
    feedbackType: string,
    rating: number,
    comments?: string
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
          feedback_type: feedbackType,
          rating: rating,
          comments: comments
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
  }
}; 