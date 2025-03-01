import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  content: any;
  isArchived: boolean;
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return data.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        userId: project.user_id,
        content: project.content || {},
        isArchived: project.is_archived
      }));
    } catch (error) {
      console.error('Error in getProjects:', error);
      return [];
    }
  },

  async getProjectById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id,
        content: data.content || {},
        isArchived: data.is_archived
      };
    } catch (error) {
      console.error('Error in getProjectById:', error);
      return null;
    }
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isArchived'>): Promise<Project | null> {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        console.error('No authenticated user found');
        return null;
      }

      const newProject = {
        name: project.name,
        description: project.description,
        user_id: userId,
        content: project.content || {}
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id,
        content: data.content || {},
        isArchived: data.is_archived
      };
    } catch (error) {
      console.error('Error in createProject:', error);
      return null;
    }
  },

  async updateProject(project: Partial<Project> & { id: string }): Promise<Project | null> {
    try {
      const updateData: any = {};
      
      if (project.name !== undefined) updateData.name = project.name;
      if (project.description !== undefined) updateData.description = project.description;
      if (project.content !== undefined) updateData.content = project.content;
      if (project.isArchived !== undefined) updateData.is_archived = project.isArchived;

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id,
        content: data.content || {},
        isArchived: data.is_archived
      };
    } catch (error) {
      console.error('Error in updateProject:', error);
      return null;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      // Instead of hard deleting, we'll set is_archived to true
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      return false;
    }
  },

  async hardDeleteProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error hard deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in hardDeleteProject:', error);
      return false;
    }
  }
}; 