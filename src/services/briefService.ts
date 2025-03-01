import { supabase } from '../lib/supabaseClient';
import { BriefFormData } from '../components/BriefForm';
import { GeneratedBrief } from '../utils/briefGenerator';

export interface Brief {
  id: string;
  project_id: string;
  product_name: string;
  form_data: BriefFormData;
  brief_data: GeneratedBrief;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_editing?: boolean;
  show_edit_buttons?: boolean;
}

export const briefService = {
  // Get all briefs for a project
  async getBriefsByProjectId(projectId: string): Promise<Brief[]> {
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching briefs:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Get a brief by ID
  async getBriefById(briefId: string): Promise<Brief | null> {
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (error) {
      console.error('Error fetching brief:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Create a new brief
  async createBrief(
    projectId: string, 
    formData: BriefFormData, 
    briefData: GeneratedBrief | string,
    isEditing: boolean = false,
    showEditButtons: boolean = false
  ): Promise<Brief> {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure briefData is an object, not a string
    const parsedBriefData = typeof briefData === 'string' 
      ? JSON.parse(briefData) as GeneratedBrief 
      : briefData;

    const newBrief = {
      project_id: projectId,
      product_name: formData.productName,
      form_data: formData,
      brief_data: parsedBriefData,
      user_id: user.id,
      is_editing: isEditing,
      show_edit_buttons: showEditButtons,
    };

    const { data, error } = await supabase
      .from('briefs')
      .insert([newBrief])
      .select()
      .single();

    if (error) {
      console.error('Error creating brief:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Update a brief
  async updateBrief(
    briefId: string, 
    briefData: GeneratedBrief,
    isEditing: boolean = false,
    showEditButtons: boolean = false
  ): Promise<Brief> {
    const { data, error } = await supabase
      .from('briefs')
      .update({
        brief_data: briefData,
        is_editing: isEditing,
        show_edit_buttons: showEditButtons,
        updated_at: new Date().toISOString()
      })
      .eq('id', briefId)
      .select()
      .single();

    if (error) {
      console.error('Error updating brief:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Delete a brief (soft delete)
  async deleteBrief(briefId: string): Promise<void> {
    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('id', briefId);

    if (error) {
      console.error('Error deleting brief:', error);
      throw new Error(error.message);
    }
  }
}; 