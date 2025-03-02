import { supabase } from '../lib/supabaseClient';
import { GeneratedPRD } from '../utils/prdGenerator';

// Local storage key
const PRD_STORAGE_KEY = 'pan-chito-prds';

// Supabase PRD interface
export interface SupabasePRD {
  id: string;
  brief_id: string;
  feature_set_id: string;
  user_id: string;
  title: string;
  overview?: string;
  goals?: string;
  user_flows?: string;
  requirements?: string;
  constraints?: string;
  timeline?: string;
  content: GeneratedPRD;
  created_at: string;
  updated_at: string;
}

// Local PRD interface
export interface PRD {
  id: string;
  briefId: string;
  featureSetId: string;
  title: string;
  overview?: string;
  goals?: string;
  userFlows?: string;
  requirements?: string;
  constraints?: string;
  timeline?: string;
  content: GeneratedPRD;
  createdAt: string;
  updatedAt: string;
}

// Map Supabase PRD to local PRD format
const mapSupabasePRDToPRD = (supabasePRD: SupabasePRD): PRD => {
  return {
    id: supabasePRD.id,
    briefId: supabasePRD.brief_id,
    featureSetId: supabasePRD.feature_set_id,
    title: supabasePRD.title,
    overview: supabasePRD.overview,
    goals: supabasePRD.goals,
    userFlows: supabasePRD.user_flows,
    requirements: supabasePRD.requirements,
    constraints: supabasePRD.constraints,
    timeline: supabasePRD.timeline,
    content: supabasePRD.content,
    createdAt: supabasePRD.created_at,
    updatedAt: supabasePRD.updated_at
  };
};

// Map local PRD to Supabase PRD format
const mapPRDToSupabasePRD = (prd: PRD, userId: string): Omit<SupabasePRD, 'created_at' | 'updated_at'> => {
  return {
    id: prd.id,
    brief_id: prd.briefId,
    feature_set_id: prd.featureSetId,
    user_id: userId,
    title: prd.title,
    overview: prd.overview,
    goals: prd.goals,
    user_flows: prd.userFlows,
    requirements: prd.requirements,
    constraints: prd.constraints,
    timeline: prd.timeline,
    content: prd.content
  };
};

// Local storage functions
const getLocalPRDs = (): PRD[] => {
  if (typeof window === 'undefined') return [];
  
  const storedPRDs = localStorage.getItem(PRD_STORAGE_KEY);
  if (!storedPRDs) return [];
  
  try {
    return JSON.parse(storedPRDs);
  } catch (error) {
    console.error('Error parsing stored PRDs:', error);
    return [];
  }
};

const saveLocalPRDs = (prds: PRD[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(prds));
};

const addOrUpdateLocalPRD = (prd: PRD): PRD => {
  const prds = getLocalPRDs();
  const existingIndex = prds.findIndex(p => p.id === prd.id);
  
  if (existingIndex >= 0) {
    prds[existingIndex] = prd;
  } else {
    prds.push(prd);
  }
  
  saveLocalPRDs(prds);
  return prd;
};

const deleteLocalPRD = (prdId: string): boolean => {
  const prds = getLocalPRDs();
  const filteredPRDs = prds.filter(p => p.id !== prdId);
  
  if (filteredPRDs.length === prds.length) {
    return false; // No PRD was removed
  }
  
  saveLocalPRDs(filteredPRDs);
  return true;
};

export const prdService = {
  // Get all PRDs for a brief
  getPRDsByBriefId: async (briefId: string): Promise<PRD[]> => {
    try {
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .eq('brief_id', briefId);

      if (error) {
        console.error('Error fetching PRDs from Supabase:', error);
        // Fall back to local storage
        const localPRDs = getLocalPRDs().filter(p => p.briefId === briefId);
        console.log('Using local PRDs instead:', localPRDs);
        return localPRDs;
      }

      // Combine Supabase and local PRDs
      const supabasePRDs = data.map(mapSupabasePRDToPRD);
      const localPRDs = getLocalPRDs().filter(p => p.briefId === briefId);
      
      // Merge the two lists, preferring Supabase data for duplicates
      const supabaseIds = new Set(supabasePRDs.map(p => p.id));
      const uniqueLocalPRDs = localPRDs.filter(p => !supabaseIds.has(p.id));
      
      const combinedPRDs = [...supabasePRDs, ...uniqueLocalPRDs];
      console.log(`Found ${combinedPRDs.length} PRDs for brief ${briefId}`);
      return combinedPRDs;
    } catch (error) {
      console.error('Error in getPRDsByBriefId:', error);
      // Fall back to local storage
      const localPRDs = getLocalPRDs().filter(p => p.briefId === briefId);
      console.log('Using local PRDs due to error:', localPRDs);
      return localPRDs;
    }
  },

  // Get a specific PRD by ID
  getPRDById: async (prdId: string): Promise<PRD | null> => {
    try {
      console.log(`prdService.getPRDById: Fetching PRD with ID: ${prdId}`);
      
      if (!prdId) {
        console.error('prdService.getPRDById: Invalid PRD ID provided');
        return null;
      }
      
      // First check local storage for faster response
      const localPRD = getLocalPRDs().find(p => p.id === prdId);
      
      if (localPRD) {
        console.log('prdService.getPRDById: PRD found in local storage:', localPRD);
      } else {
        console.log('prdService.getPRDById: PRD not found in local storage');
      }
      
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .eq('id', prdId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, use local storage if available
          if (localPRD) {
            console.log('prdService.getPRDById: PRD found in local storage but not in Supabase');
            return localPRD;
          }
          console.log('prdService.getPRDById: PRD not found in Supabase or local storage');
          return null;
        }
        console.error('prdService.getPRDById: Error fetching PRD from Supabase:', error);
        // Fall back to local storage
        if (localPRD) {
          console.log('prdService.getPRDById: Using local PRD due to Supabase error');
          return localPRD;
        }
        return null;
      }

      if (data) {
        const mappedPRD = mapSupabasePRDToPRD(data);
        console.log('prdService.getPRDById: PRD found in Supabase:', mappedPRD);
        
        // Update local storage with the latest data
        addOrUpdateLocalPRD(mappedPRD);
        console.log('prdService.getPRDById: Updated local storage with Supabase data');
        
        return mappedPRD;
      }
      
      if (localPRD) {
        console.log('prdService.getPRDById: Using local PRD as fallback');
        return localPRD;
      }
      
      console.log('prdService.getPRDById: No PRD found with ID:', prdId);
      return null;
    } catch (error) {
      console.error('prdService.getPRDById: Error:', error);
      // Fall back to local storage
      const localPRD = getLocalPRDs().find(p => p.id === prdId);
      console.log('prdService.getPRDById: Using local PRD due to error:', localPRD);
      return localPRD || null;
    }
  },

  // Save a PRD (create or update)
  savePRD: async (prd: PRD): Promise<PRD> => {
    try {
      console.log('prdService.savePRD: Saving PRD:', prd.id);
      
      // Validate PRD object
      if (!prd.id || !prd.briefId || !prd.content) {
        console.error('prdService.savePRD: Invalid PRD object: missing required fields');
        throw new Error('Invalid PRD object: missing required fields');
      }
      
      // First, save to local storage as a backup
      const localPRD = addOrUpdateLocalPRD(prd);
      console.log('prdService.savePRD: PRD saved to local storage');
      
      // Log all PRDs in local storage for debugging
      const allLocalPRDs = getLocalPRDs();
      console.log(`prdService.savePRD: Total PRDs in local storage: ${allLocalPRDs.length}`);
      console.log('prdService.savePRD: All PRD IDs in local storage:', allLocalPRDs.map(p => p.id));
      
      // Then try to save to Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.warn('prdService.savePRD: User not authenticated, using local storage only');
        return localPRD;
      }
      
      const userId = userData.user.id;
      const supabasePRD = mapPRDToSupabasePRD(prd, userId);
      
      // Check if PRD already exists
      const { data: existingPRD } = await supabase
        .from('prds')
        .select('*')
        .eq('id', prd.id)
        .single();
      
      let result;
      
      if (existingPRD) {
        // Update existing PRD
        console.log('prdService.savePRD: Updating existing PRD in Supabase');
        const { data, error } = await supabase
          .from('prds')
          .update(supabasePRD)
          .eq('id', prd.id)
          .select()
          .single();
        
        if (error) {
          console.error('prdService.savePRD: Error updating PRD in Supabase:', error);
          return localPRD;
        }
        
        result = data;
        console.log('prdService.savePRD: PRD updated in Supabase');
      } else {
        // Create new PRD
        console.log('prdService.savePRD: Creating new PRD in Supabase');
        const { data, error } = await supabase
          .from('prds')
          .insert(supabasePRD)
          .select()
          .single();
        
        if (error) {
          console.error('prdService.savePRD: Error creating PRD in Supabase:', error);
          return localPRD;
        }
        
        result = data;
        console.log('prdService.savePRD: PRD created in Supabase');
      }
      
      const mappedResult = mapSupabasePRDToPRD(result);
      
      // Update local storage with the latest data from Supabase
      addOrUpdateLocalPRD(mappedResult);
      console.log('prdService.savePRD: Updated local storage with Supabase data');
      
      return mappedResult;
    } catch (error) {
      console.error('prdService.savePRD: Error:', error);
      // Return the locally saved PRD
      return prd;
    }
  },

  // Update a PRD
  updatePRD: async (prdId: string, updates: Partial<Omit<PRD, 'id' | 'briefId' | 'createdAt'>>): Promise<PRD> => {
    try {
      // First, update in local storage
      const localPRDs = getLocalPRDs();
      const prdIndex = localPRDs.findIndex(p => p.id === prdId);
      
      if (prdIndex >= 0) {
        const updatedPRD = { ...localPRDs[prdIndex], ...updates, updatedAt: new Date().toISOString() };
        localPRDs[prdIndex] = updatedPRD;
        saveLocalPRDs(localPRDs);
        
        // Then try to update in Supabase
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.warn('User not authenticated, using local storage only');
          return updatedPRD;
        }
        
        // Convert local format updates to Supabase format
        const supabaseUpdates: any = {};
        
        if (updates.title) supabaseUpdates.title = updates.title;
        if (updates.featureSetId) supabaseUpdates.feature_set_id = updates.featureSetId;
        if (updates.overview) supabaseUpdates.overview = updates.overview;
        if (updates.goals) supabaseUpdates.goals = updates.goals;
        if (updates.userFlows) supabaseUpdates.user_flows = updates.userFlows;
        if (updates.requirements) supabaseUpdates.requirements = updates.requirements;
        if (updates.constraints) supabaseUpdates.constraints = updates.constraints;
        if (updates.timeline) supabaseUpdates.timeline = updates.timeline;
        if (updates.content) supabaseUpdates.content = updates.content;
        supabaseUpdates.updated_at = updatedPRD.updatedAt;
        
        const { data, error } = await supabase
          .from('prds')
          .update(supabaseUpdates)
          .eq('id', prdId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating PRD in Supabase:', error);
          return updatedPRD;
        }
        
        return mapSupabasePRDToPRD(data);
      } else {
        throw new Error(`PRD with ID ${prdId} not found`);
      }
    } catch (error) {
      console.error('Error in updatePRD:', error);
      throw error;
    }
  },

  // Delete a PRD
  deletePRD: async (prdId: string): Promise<boolean> => {
    try {
      console.log(`Deleting PRD with ID: ${prdId}`);
      
      // Delete from local storage first
      const localDeleted = deleteLocalPRD(prdId);
      
      // Try to delete from Supabase
      const { error } = await supabase
        .from('prds')
        .delete()
        .eq('id', prdId);
      
      if (error) {
        console.error('Error deleting PRD from Supabase:', error);
        return localDeleted;
      }
      
      console.log('PRD deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deletePRD:', error);
      return false;
    }
  }
}; 