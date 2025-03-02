import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Local storage key
const TECH_DOC_STORAGE_KEY = 'techDocs';

// Supabase TechDoc interface
export interface SupabaseTechDoc {
  id: string;
  prd_id: string;
  user_id: string;
  tech_stack: string;
  frontend: string;
  backend: string;
  content: {
    platform: {
      targets: string[];
      requirements: string[];
    };
    frontend: any;
    backend: any;
    api: any;
    database: any;
    deployment: any;
  };
  created_at: string;
  updated_at: string;
}

// Local TechDoc interface
export interface TechDoc {
  id: string;
  prdId: string;
  techStack: string;
  frontend: string;
  backend: string;
  createdAt: string;
  updatedAt: string;
  content: {
    platform: {
      targets: string[];
      requirements: string[];
    };
    frontend: any;
    backend: any;
    api: any;
    database: any;
    deployment: any;
  };
}

// Map Supabase TechDoc to local TechDoc format
const mapSupabaseTechDocToTechDoc = (supabaseTechDoc: SupabaseTechDoc): TechDoc => {
  return {
    id: supabaseTechDoc.id,
    prdId: supabaseTechDoc.prd_id,
    techStack: supabaseTechDoc.tech_stack,
    frontend: supabaseTechDoc.frontend,
    backend: supabaseTechDoc.backend,
    content: supabaseTechDoc.content,
    createdAt: supabaseTechDoc.created_at,
    updatedAt: supabaseTechDoc.updated_at
  };
};

// Map local TechDoc to Supabase TechDoc format
const mapTechDocToSupabaseTechDoc = (techDoc: TechDoc, userId: string): Omit<SupabaseTechDoc, 'created_at' | 'updated_at'> => {
  return {
    id: techDoc.id,
    prd_id: techDoc.prdId,
    user_id: userId,
    tech_stack: techDoc.techStack,
    frontend: techDoc.frontend,
    backend: techDoc.backend,
    content: techDoc.content
  };
};

// Local storage functions
const getLocalTechDocs = (): TechDoc[] => {
  if (typeof window === 'undefined') return [];
  
  const storedTechDocs = localStorage.getItem(TECH_DOC_STORAGE_KEY);
  if (!storedTechDocs) return [];
  
  try {
    return JSON.parse(storedTechDocs);
  } catch (error) {
    console.error('Error parsing stored tech docs:', error);
    return [];
  }
};

const saveLocalTechDocs = (techDocs: TechDoc[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TECH_DOC_STORAGE_KEY, JSON.stringify(techDocs));
};

const addOrUpdateLocalTechDoc = (techDoc: TechDoc): TechDoc => {
  const techDocs = getLocalTechDocs();
  const existingIndex = techDocs.findIndex(doc => doc.id === techDoc.id);
  
  if (existingIndex >= 0) {
    techDocs[existingIndex] = techDoc;
  } else {
    techDocs.push(techDoc);
  }
  
  saveLocalTechDocs(techDocs);
  return techDoc;
};

const deleteLocalTechDoc = (techDocId: string): boolean => {
  const techDocs = getLocalTechDocs();
  const filteredTechDocs = techDocs.filter(doc => doc.id !== techDocId);
  
  if (filteredTechDocs.length === techDocs.length) {
    return false; // No tech doc was removed
  }
  
  saveLocalTechDocs(filteredTechDocs);
  return true;
};

export const techDocService = {
  // Get a tech doc by PRD ID
  getTechDocByPrdId: async (prdId: string): Promise<TechDoc | null> => {
    try {
      console.log(`techDocService.getTechDocByPrdId: Fetching tech doc for PRD ID: ${prdId}`);
      
      if (!prdId) {
        console.error('techDocService.getTechDocByPrdId: Invalid PRD ID provided');
        return null;
      }
      
      // First check local storage for faster response
      const localTechDoc = getLocalTechDocs().find(doc => doc.prdId === prdId);
      
      if (localTechDoc) {
        console.log('techDocService.getTechDocByPrdId: Tech doc found in local storage:', localTechDoc);
      } else {
        console.log('techDocService.getTechDocByPrdId: Tech doc not found in local storage');
      }
      
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('tech_docs')
        .select('*')
        .eq('prd_id', prdId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, use local storage if available
          if (localTechDoc) {
            console.log('techDocService.getTechDocByPrdId: Tech doc found in local storage but not in Supabase');
            return localTechDoc;
          }
          console.log('techDocService.getTechDocByPrdId: Tech doc not found in Supabase or local storage');
          return null;
        }
        console.error('techDocService.getTechDocByPrdId: Error fetching tech doc from Supabase:', error);
        // Fall back to local storage
        if (localTechDoc) {
          console.log('techDocService.getTechDocByPrdId: Using local tech doc due to Supabase error');
          return localTechDoc;
        }
        return null;
      }

      if (data) {
        const mappedTechDoc = mapSupabaseTechDocToTechDoc(data);
        console.log('techDocService.getTechDocByPrdId: Tech doc found in Supabase:', mappedTechDoc);
        
        // Update local storage with the latest data
        addOrUpdateLocalTechDoc(mappedTechDoc);
        console.log('techDocService.getTechDocByPrdId: Updated local storage with Supabase data');
        
        return mappedTechDoc;
      }
      
      if (localTechDoc) {
        console.log('techDocService.getTechDocByPrdId: Using local tech doc as fallback');
        return localTechDoc;
      }
      
      console.log('techDocService.getTechDocByPrdId: No tech doc found for PRD ID:', prdId);
      return null;
    } catch (error) {
      console.error('techDocService.getTechDocByPrdId: Error:', error);
      // Fall back to local storage
      const localTechDoc = getLocalTechDocs().find(doc => doc.prdId === prdId);
      console.log('techDocService.getTechDocByPrdId: Using local tech doc due to error:', localTechDoc);
      return localTechDoc || null;
    }
  },

  // Get a tech doc by ID
  getTechDocById: async (techDocId: string): Promise<TechDoc | null> => {
    try {
      console.log(`techDocService.getTechDocById: Fetching tech doc with ID: ${techDocId}`);
      
      if (!techDocId) {
        console.error('techDocService.getTechDocById: Invalid tech doc ID provided');
        return null;
      }
      
      // First check local storage for faster response
      const localTechDoc = getLocalTechDocs().find(doc => doc.id === techDocId);
      
      if (localTechDoc) {
        console.log('techDocService.getTechDocById: Tech doc found in local storage:', localTechDoc);
      } else {
        console.log('techDocService.getTechDocById: Tech doc not found in local storage');
      }
      
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('tech_docs')
        .select('*')
        .eq('id', techDocId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, use local storage if available
          if (localTechDoc) {
            console.log('techDocService.getTechDocById: Tech doc found in local storage but not in Supabase');
            return localTechDoc;
          }
          console.log('techDocService.getTechDocById: Tech doc not found in Supabase or local storage');
          return null;
        }
        console.error('techDocService.getTechDocById: Error fetching tech doc from Supabase:', error);
        // Fall back to local storage
        if (localTechDoc) {
          console.log('techDocService.getTechDocById: Using local tech doc due to Supabase error');
          return localTechDoc;
        }
        return null;
      }

      if (data) {
        const mappedTechDoc = mapSupabaseTechDocToTechDoc(data);
        console.log('techDocService.getTechDocById: Tech doc found in Supabase:', mappedTechDoc);
        
        // Update local storage with the latest data
        addOrUpdateLocalTechDoc(mappedTechDoc);
        console.log('techDocService.getTechDocById: Updated local storage with Supabase data');
        
        return mappedTechDoc;
      }
      
      if (localTechDoc) {
        console.log('techDocService.getTechDocById: Using local tech doc as fallback');
        return localTechDoc;
      }
      
      console.log('techDocService.getTechDocById: No tech doc found with ID:', techDocId);
      return null;
    } catch (error) {
      console.error('techDocService.getTechDocById: Error:', error);
      // Fall back to local storage
      const localTechDoc = getLocalTechDocs().find(doc => doc.id === techDocId);
      console.log('techDocService.getTechDocById: Using local tech doc due to error:', localTechDoc);
      return localTechDoc || null;
    }
  },

  // Save a tech doc (create or update)
  saveTechDoc: async (techDoc: Omit<TechDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<TechDoc> => {
    try {
      console.log('techDocService.saveTechDoc: Saving tech doc for PRD ID:', techDoc.prdId);
      
      // Validate tech doc object
      if (!techDoc.prdId || !techDoc.content) {
        console.error('techDocService.saveTechDoc: Invalid tech doc object: missing required fields');
        throw new Error('Invalid tech doc object: missing required fields');
      }
      
      // Check if a tech doc already exists for this PRD
      const existingTechDoc = await techDocService.getTechDocByPrdId(techDoc.prdId);
      
      const now = new Date().toISOString();
      let techDocToSave: TechDoc;
      
      if (existingTechDoc) {
        // Update existing tech doc
        techDocToSave = {
          ...existingTechDoc,
          ...techDoc,
          updatedAt: now
        };
      } else {
        // Create new tech doc
        techDocToSave = {
          id: uuidv4(),
          ...techDoc,
          createdAt: now,
          updatedAt: now
        };
      }
      
      // First, save to local storage as a backup
      const localTechDoc = addOrUpdateLocalTechDoc(techDocToSave);
      console.log('techDocService.saveTechDoc: Tech doc saved to local storage');
      
      // Then try to save to Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.warn('techDocService.saveTechDoc: User not authenticated, using local storage only');
        return localTechDoc;
      }
      
      const userId = userData.user.id;
      const supabaseTechDoc = mapTechDocToSupabaseTechDoc(techDocToSave, userId);
      
      // Check if tech doc already exists in Supabase
      const { data: existingSupabaseTechDoc } = await supabase
        .from('tech_docs')
        .select('*')
        .eq('id', techDocToSave.id)
        .single();
      
      let result;
      
      if (existingSupabaseTechDoc) {
        // Update existing tech doc
        console.log('techDocService.saveTechDoc: Updating existing tech doc in Supabase');
        const { data, error } = await supabase
          .from('tech_docs')
          .update(supabaseTechDoc)
          .eq('id', techDocToSave.id)
          .select()
          .single();
        
        if (error) {
          console.error('techDocService.saveTechDoc: Error updating tech doc in Supabase:', error);
          return localTechDoc;
        }
        
        result = data;
        console.log('techDocService.saveTechDoc: Tech doc updated in Supabase');
      } else {
        // Create new tech doc
        console.log('techDocService.saveTechDoc: Creating new tech doc in Supabase');
        const { data, error } = await supabase
          .from('tech_docs')
          .insert(supabaseTechDoc)
          .select()
          .single();
        
        if (error) {
          console.error('techDocService.saveTechDoc: Error creating tech doc in Supabase:', error);
          return localTechDoc;
        }
        
        result = data;
        console.log('techDocService.saveTechDoc: Tech doc created in Supabase');
      }
      
      const mappedResult = mapSupabaseTechDocToTechDoc(result);
      
      // Update local storage with the latest data from Supabase
      addOrUpdateLocalTechDoc(mappedResult);
      console.log('techDocService.saveTechDoc: Updated local storage with Supabase data');
      
      return mappedResult;
    } catch (error) {
      console.error('techDocService.saveTechDoc: Error:', error);
      // Return the locally saved tech doc or create a new one
      if ('id' in techDoc) {
        return techDoc as TechDoc;
      } else {
        const now = new Date().toISOString();
        const newTechDoc: TechDoc = {
          id: uuidv4(),
          ...techDoc,
          createdAt: now,
          updatedAt: now
        };
        addOrUpdateLocalTechDoc(newTechDoc);
        return newTechDoc;
      }
    }
  },

  // Delete a tech doc
  deleteTechDoc: async (techDocId: string): Promise<boolean> => {
    try {
      console.log(`techDocService.deleteTechDoc: Deleting tech doc with ID: ${techDocId}`);
      
      // Delete from local storage first
      const localDeleted = deleteLocalTechDoc(techDocId);
      
      // Try to delete from Supabase
      const { error } = await supabase
        .from('tech_docs')
        .delete()
        .eq('id', techDocId);
      
      if (error) {
        console.error('techDocService.deleteTechDoc: Error deleting tech doc from Supabase:', error);
        return localDeleted;
      }
      
      console.log('techDocService.deleteTechDoc: Tech doc deleted successfully');
      return true;
    } catch (error) {
      console.error('techDocService.deleteTechDoc: Error:', error);
      return false;
    }
  },

  // Delete all tech docs for a PRD
  deleteAllTechDocsForPRD: async (prdId: string): Promise<boolean> => {
    try {
      console.log(`techDocService.deleteAllTechDocsForPRD: Deleting all tech docs for PRD ID: ${prdId}`);
      
      // Delete from local storage first
      const techDocs = getLocalTechDocs();
      const filteredTechDocs = techDocs.filter(doc => doc.prdId !== prdId);
      const localDeleted = filteredTechDocs.length !== techDocs.length;
      
      if (localDeleted) {
        saveLocalTechDocs(filteredTechDocs);
        console.log('techDocService.deleteAllTechDocsForPRD: Tech docs deleted from local storage');
      }
      
      // Try to delete from Supabase
      const { error } = await supabase
        .from('tech_docs')
        .delete()
        .eq('prd_id', prdId);
      
      if (error) {
        console.error('techDocService.deleteAllTechDocsForPRD: Error deleting tech docs from Supabase:', error);
        return localDeleted;
      }
      
      console.log('techDocService.deleteAllTechDocsForPRD: Tech docs deleted successfully from Supabase');
      return true;
    } catch (error) {
      console.error('techDocService.deleteAllTechDocsForPRD: Error:', error);
      return false;
    }
  }
}; 