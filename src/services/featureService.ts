import { supabase } from '../lib/supabaseClient';
import { Feature, FeatureSet } from '../utils/featureStore';

// Interface for the feature in Supabase
export interface SupabaseFeature {
  id: string;
  brief_id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

// Interface for the feature set in Supabase
export interface SupabaseFeatureSet {
  id: string;
  brief_id: string;
  project_id: string;
  user_id: string;
  key_questions: string[];
  created_at: string;
  updated_at: string;
}

// Convert Supabase feature to local feature format
const mapSupabaseFeatureToFeature = (feature: SupabaseFeature): Feature => ({
  id: feature.id,
  briefId: feature.brief_id,
  name: feature.name,
  title: feature.name,
  description: feature.description,
  priority: feature.priority,
  difficulty: feature.difficulty,
  createdAt: feature.created_at
});

// Convert local feature to Supabase feature format
const mapFeatureToSupabaseFeature = (feature: Feature, projectId: string): Omit<SupabaseFeature, 'id' | 'user_id' | 'created_at' | 'updated_at'> => ({
  brief_id: feature.briefId,
  project_id: projectId,
  name: feature.name,
  description: feature.description,
  priority: feature.priority,
  difficulty: feature.difficulty
});

export const featureService = {
  // Get all features for a brief
  async getFeaturesByBriefId(briefId: string): Promise<Feature[]> {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching features:', error);
      throw new Error(error.message);
    }

    return (data || []).map(mapSupabaseFeatureToFeature);
  },

  // Get a feature set by brief ID
  async getFeatureSetByBriefId(briefId: string): Promise<FeatureSet | null> {
    // First, check if a feature set exists
    const { data: featureSetData, error: featureSetError } = await supabase
      .from('feature_sets')
      .select('*')
      .eq('brief_id', briefId)
      .single();

    if (featureSetError && featureSetError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching feature set:', featureSetError);
      throw new Error(featureSetError.message);
    }

    if (!featureSetData) {
      return null;
    }

    // Then get all features for this brief
    const { data: featuresData, error: featuresError } = await supabase
      .from('features')
      .select('*')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: true });

    if (featuresError) {
      console.error('Error fetching features:', featuresError);
      throw new Error(featuresError.message);
    }

    return {
      id: featureSetData.id,
      briefId: featureSetData.brief_id,
      features: (featuresData || []).map(mapSupabaseFeatureToFeature),
      keyQuestions: featureSetData.key_questions || [],
      createdAt: featureSetData.created_at
    };
  },

  // Save a new feature set
  async saveFeatureSet(briefId: string, projectId: string, features: Feature[], keyQuestions: string[]): Promise<FeatureSet> {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, check if a feature set already exists for this brief
    const { data: existingFeatureSet, error: checkError } = await supabase
      .from('feature_sets')
      .select('*')
      .eq('brief_id', briefId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing feature set:', checkError);
      throw new Error(checkError.message);
    }

    // Delete any existing features for this brief
    if (existingFeatureSet) {
      const { error: deleteError } = await supabase
        .from('features')
        .delete()
        .eq('brief_id', briefId);

      if (deleteError) {
        console.error('Error deleting existing features:', deleteError);
        throw new Error(deleteError.message);
      }
    }

    // Create or update the feature set
    let featureSetData;
    if (existingFeatureSet) {
      // Update existing feature set
      const { data, error } = await supabase
        .from('feature_sets')
        .update({
          key_questions: keyQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeatureSet.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating feature set:', error);
        throw new Error(error.message);
      }
      featureSetData = data;
    } else {
      // Create new feature set
      const { data, error } = await supabase
        .from('feature_sets')
        .insert([{
          brief_id: briefId,
          project_id: projectId,
          user_id: user.id,
          key_questions: keyQuestions
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating feature set:', error);
        throw new Error(error.message);
      }
      featureSetData = data;
    }

    // Insert all features
    const featuresToInsert = features.map(feature => ({
      ...mapFeatureToSupabaseFeature(feature, projectId),
      user_id: user.id
    }));

    const { data: featuresData, error: featuresError } = await supabase
      .from('features')
      .insert(featuresToInsert)
      .select();

    if (featuresError) {
      console.error('Error creating features:', featuresError);
      throw new Error(featuresError.message);
    }

    return {
      id: featureSetData.id,
      briefId,
      features: (featuresData || []).map(mapSupabaseFeatureToFeature),
      keyQuestions,
      createdAt: featureSetData.created_at
    };
  },

  // Add a new feature
  async addFeature(briefId: string, projectId: string, feature: Omit<Feature, 'id' | 'createdAt'>): Promise<Feature> {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('features')
      .insert([{
        ...mapFeatureToSupabaseFeature(feature as Feature, projectId),
        brief_id: briefId,
        project_id: projectId,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding feature:', error);
      throw new Error(error.message);
    }

    return mapSupabaseFeatureToFeature(data);
  },

  // Update a feature
  async updateFeature(featureId: string, updatedFeature: Partial<Feature>): Promise<Feature> {
    const { data, error } = await supabase
      .from('features')
      .update({
        name: updatedFeature.name,
        description: updatedFeature.description,
        priority: updatedFeature.priority,
        difficulty: updatedFeature.difficulty
      })
      .eq('id', featureId)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature:', error);
      throw new Error(error.message);
    }

    return mapSupabaseFeatureToFeature(data);
  },

  // Delete a feature
  async deleteFeature(featureId: string): Promise<void> {
    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', featureId);

    if (error) {
      console.error('Error deleting feature:', error);
      throw new Error(error.message);
    }
  },

  // Delete all features for a brief
  async deleteFeaturesByBriefId(briefId: string): Promise<void> {
    // First delete all features
    const { error: featuresError } = await supabase
      .from('features')
      .delete()
      .eq('brief_id', briefId);

    if (featuresError) {
      console.error('Error deleting features:', featuresError);
      throw new Error(featuresError.message);
    }

    // Then delete the feature set
    const { error: featureSetError } = await supabase
      .from('feature_sets')
      .delete()
      .eq('brief_id', briefId);

    if (featureSetError) {
      console.error('Error deleting feature set:', featureSetError);
      throw new Error(featureSetError.message);
    }
  }
}; 