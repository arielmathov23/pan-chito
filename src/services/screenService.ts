import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { ScreenSet, Screen, AppFlow, FlowStep } from '../utils/screenStore';

// Supabase types
export interface SupabaseScreen {
  id: string;
  prd_id: string;
  name: string;
  description: string;
  elements: any[];
  created_at: string;
  updated_at: string;
  user_id: string;
  svg_wireframe?: string;
}

export interface SupabaseAppFlow {
  id: string;
  prd_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SupabaseFlowStep {
  id: string;
  app_flow_id: string;
  description: string;
  screen_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Mapping functions
function mapScreenToSupabase(screen: Screen): Omit<SupabaseScreen, 'created_at' | 'updated_at' | 'user_id'> {
  console.log(`Mapping screen to Supabase format. Screen ID: ${screen.id}, Has featureId: ${!!screen.featureId}`);
  
  // Only add metadata if the screen has a featureId
  let elementsWithMetadata = [...(screen.elements || [])];
  
  if (screen.featureId) {
    // Check if we already have a metadata element
    const metadataIndex = elementsWithMetadata.findIndex(el => el.type === '_metadata');
    
    if (metadataIndex >= 0) {
      // Update existing metadata
      elementsWithMetadata[metadataIndex] = {
        ...elementsWithMetadata[metadataIndex],
        properties: {
          ...elementsWithMetadata[metadataIndex].properties,
          featureId: screen.featureId
        }
      };
    } else {
      // Add new metadata element
      elementsWithMetadata.push({
        id: uuidv4(),
        type: '_metadata',
        properties: {
          featureId: screen.featureId
        }
      });
    }
  }
  
  return {
    id: screen.id,
    prd_id: screen.prdId,
    name: screen.name,
    description: screen.description || '',
    elements: elementsWithMetadata,
    svg_wireframe: screen.svgWireframe
  };
}

function mapSupabaseToScreen(screen: SupabaseScreen): Screen {
  // Extract featureId from metadata in elements with defensive checks
  let featureId = '';
  let elements: any[] = [];
  
  // Check if elements array exists
  if (Array.isArray(screen.elements)) {
    elements = [...screen.elements];
    
    // Look for metadata element
    const metadataIndex = elements.findIndex(el => el && el.type === '_metadata');
    
    if (metadataIndex >= 0) {
      // Extract featureId from metadata if it exists
      const metadata = elements[metadataIndex];
      if (metadata && metadata.properties && metadata.properties.featureId) {
        featureId = metadata.properties.featureId;
        console.log(`Found featureId in metadata: ${featureId} for screen: ${screen.id}`);
      }
      
      // Remove metadata element from the array that will be displayed
      elements.splice(metadataIndex, 1);
    } else {
      console.log(`No metadata element found for screen: ${screen.id}`);
    }
  } else {
    console.log(`No elements array found for screen: ${screen.id}`);
    elements = [];
  }
  
  return {
    id: screen.id,
    prdId: screen.prd_id,
    name: screen.name,
    description: screen.description,
    featureId: featureId,
    elements: elements,
    createdAt: new Date(screen.created_at).getTime(),
    svgWireframe: screen.svg_wireframe
  };
}

function mapFlowStepToSupabase(step: FlowStep, position: number, appFlowId: string): Omit<SupabaseFlowStep, 'created_at' | 'updated_at'> {
  return {
    id: step.id,
    app_flow_id: appFlowId,
    description: step.description,
    screen_id: step.screenId || null,
    position
  };
}

function mapSupabaseToFlowStep(step: SupabaseFlowStep): FlowStep {
  return {
    id: step.id,
    description: step.description,
    screenId: step.screen_id || undefined,
    // We won't have screenReference for existing records
    screenReference: undefined
  };
}

// Local storage functions for fallback
const STORAGE_KEY = 'pan-chito-screens';

function getLocalScreenSets(): ScreenSet[] {
  if (typeof window === 'undefined') return [];
  const screenSets = localStorage.getItem(STORAGE_KEY);
  return screenSets ? JSON.parse(screenSets) : [];
}

function saveLocalScreenSets(screenSets: ScreenSet[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(screenSets));
}

const screenService = {
  // Get screen set by PRD ID
  async getScreenSetByPrdId(prdId: string): Promise<ScreenSet | null> {
    try {
      console.log(`Fetching screen set for PRD ID: ${prdId}`);
      
      // First check if app flow exists using a more reliable approach
      const { data: appFlowsData, error: appFlowsError } = await supabase
        .from('app_flows')
        .select('*')
        .eq('prd_id', prdId);
      
      // If there's an error or no data, return an empty screen set
      if (appFlowsError || !appFlowsData || appFlowsData.length === 0) {
        console.log(`No app flow found for PRD ID: ${prdId}, returning empty screen set`);
        return {
          screens: [],
          appFlow: {
            id: uuidv4(),
            prdId,
            steps: [],
            createdAt: Date.now()
          }
        };
      }
      
      // Use the first app flow if multiple exist
      const appFlowData = appFlowsData[0];
      
      // Fetch screens
      const { data: screensData, error: screensError } = await supabase
        .from('screens')
        .select('*')
        .eq('prd_id', prdId);
      
      if (screensError) {
        console.log('Error fetching screens, returning empty screen set:', screensError);
        return {
          screens: [],
          appFlow: {
            id: appFlowData.id,
            prdId,
            steps: [],
            createdAt: new Date(appFlowData.created_at).getTime()
          }
        };
      }
      
      // Fetch flow steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('flow_steps')
        .select('*')
        .eq('app_flow_id', appFlowData.id)
        .order('position', { ascending: true });
      
      if (stepsError) {
        console.log('Error fetching flow steps, returning empty screen set:', stepsError);
        return {
          screens: screensData ? screensData.map(mapSupabaseToScreen) : [],
          appFlow: {
            id: appFlowData.id,
            prdId,
            steps: [],
            createdAt: new Date(appFlowData.created_at).getTime()
          }
        };
      }
      
      // Map data to local format
      const screens = screensData.map(mapSupabaseToScreen);
      const steps = stepsData.map(mapSupabaseToFlowStep);
      
      const appFlow: AppFlow = {
        id: appFlowData.id,
        prdId: appFlowData.prd_id,
        steps,
        createdAt: new Date(appFlowData.created_at).getTime()
      };
      
      return {
        screens,
        appFlow
      };
    } catch (error) {
      console.error('Error in getScreenSetByPrdId:', error);
      // Return empty screen set instead of falling back to local storage
      return {
        screens: [],
        appFlow: {
          id: uuidv4(),
          prdId,
          steps: [],
          createdAt: Date.now()
        }
      };
    }
  },
  
  // Save screen set
  async saveScreenSet(prdId: string, screens: Screen[], appFlow: AppFlow): Promise<ScreenSet> {
    try {
      console.log(`Saving screen set for PRD ID: ${prdId}`);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if app flow already exists
      const { data: existingAppFlow } = await supabase
        .from('app_flows')
        .select('id')
        .eq('prd_id', prdId)
        .single();
      
      let appFlowId = appFlow.id;
      
      // If app flow exists, delete all related data first
      if (existingAppFlow) {
        appFlowId = existingAppFlow.id;
        
        // Delete existing flow steps
        await supabase
          .from('flow_steps')
          .delete()
          .eq('app_flow_id', appFlowId);
        
        // Delete existing screens
        await supabase
          .from('screens')
          .delete()
          .eq('prd_id', prdId);
        
        // Update app flow
        await supabase
          .from('app_flows')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', appFlowId);
      } else {
        // Create new app flow
        const { data: newAppFlow, error: appFlowError } = await supabase
          .from('app_flows')
          .insert([{
            id: appFlowId,
            prd_id: prdId,
            user_id: user.id
          }])
          .select()
          .single();
        
        if (appFlowError) {
          console.error('Error creating app flow:', appFlowError);
          throw appFlowError;
        }
        
        appFlowId = newAppFlow.id;
      }
      
      // Insert screens
      const screenInserts = screens.map(screen => ({
        ...mapScreenToSupabase(screen),
        user_id: user.id
      }));
      
      const { data: insertedScreens, error: screensError } = await supabase
        .from('screens')
        .insert(screenInserts)
        .select();
      
      if (screensError) {
        console.error('Error inserting screens:', screensError);
        throw screensError;
      }
      
      // Insert flow steps
      const stepInserts = appFlow.steps.map((step, index) => 
        mapFlowStepToSupabase(step, index, appFlowId)
      );
      
      const { error: stepsError } = await supabase
        .from('flow_steps')
        .insert(stepInserts);
      
      if (stepsError) {
        console.error('Error inserting flow steps:', stepsError);
        throw stepsError;
      }
      
      // Return the saved screen set
      return {
        screens: insertedScreens.map(mapSupabaseToScreen),
        appFlow: {
          id: appFlowId,
          prdId,
          steps: appFlow.steps,
          createdAt: Date.now()
        }
      };
    } catch (error) {
      console.error('Error in saveScreenSet:', error);
      
      // Fall back to local storage
      const screenSet: ScreenSet = {
        screens,
        appFlow
      };
      
      const localScreenSets = getLocalScreenSets();
      const existingIndex = localScreenSets.findIndex(set => set.appFlow.prdId === prdId);
      
      if (existingIndex >= 0) {
        localScreenSets[existingIndex] = screenSet;
      } else {
        localScreenSets.push(screenSet);
      }
      
      saveLocalScreenSets(localScreenSets);
      return screenSet;
    }
  },
  
  // Update app flow
  async updateAppFlow(appFlow: AppFlow): Promise<AppFlow> {
    try {
      console.log(`Updating app flow: ${appFlow.id}`);
      
      // Delete existing flow steps
      await supabase
        .from('flow_steps')
        .delete()
        .eq('app_flow_id', appFlow.id);
      
      // Insert updated flow steps
      const stepInserts = appFlow.steps.map((step, index) => 
        mapFlowStepToSupabase(step, index, appFlow.id)
      );
      
      const { error: stepsError } = await supabase
        .from('flow_steps')
        .insert(stepInserts);
      
      if (stepsError) {
        console.error('Error updating flow steps:', stepsError);
        throw stepsError;
      }
      
      // Update app flow timestamp
      await supabase
        .from('app_flows')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', appFlow.id);
      
      return appFlow;
    } catch (error) {
      console.error('Error in updateAppFlow:', error);
      
      // Fall back to local storage
      const localScreenSets = getLocalScreenSets();
      const screenSetIndex = localScreenSets.findIndex(set => set.appFlow.id === appFlow.id);
      
      if (screenSetIndex >= 0) {
        localScreenSets[screenSetIndex].appFlow = appFlow;
        saveLocalScreenSets(localScreenSets);
      }
      
      return appFlow;
    }
  },
  
  // Delete screen set
  async deleteScreenSet(appFlowId: string): Promise<boolean> {
    try {
      console.log(`Deleting screen set with app flow ID: ${appFlowId}`);
      
      // Get the app flow to find the PRD ID
      const { data: appFlow } = await supabase
        .from('app_flows')
        .select('prd_id')
        .eq('id', appFlowId)
        .single();
      
      if (!appFlow) {
        console.error('App flow not found');
        return false;
      }
      
      // Delete flow steps (will cascade delete)
      const { error: deleteError } = await supabase
        .from('app_flows')
        .delete()
        .eq('id', appFlowId);
      
      if (deleteError) {
        console.error('Error deleting app flow:', deleteError);
        throw deleteError;
      }
      
      // Delete screens
      await supabase
        .from('screens')
        .delete()
        .eq('prd_id', appFlow.prd_id);
      
      return true;
    } catch (error) {
      console.error('Error in deleteScreenSet:', error);
      
      // Fall back to local storage
      const localScreenSets = getLocalScreenSets();
      const filteredScreenSets = localScreenSets.filter(set => set.appFlow.id !== appFlowId);
      
      if (filteredScreenSets.length !== localScreenSets.length) {
        saveLocalScreenSets(filteredScreenSets);
        return true;
      }
      
      return false;
    }
  },
  
  // Update a screen
  async updateScreen(screen: Screen): Promise<Screen> {
    try {
      console.log(`Updating screen: ${screen.id}`);
      
      const { data, error } = await supabase
        .from('screens')
        .update({
          ...mapScreenToSupabase(screen),
          updated_at: new Date().toISOString()
        })
        .eq('id', screen.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating screen:', error);
        throw error;
      }
      
      return mapSupabaseToScreen(data);
    } catch (error) {
      console.error('Error in updateScreen:', error);
      
      // Fall back to local storage
      const localScreenSets = getLocalScreenSets();
      
      for (const screenSet of localScreenSets) {
        const screenIndex = screenSet.screens.findIndex(s => s.id === screen.id);
        if (screenIndex >= 0) {
          screenSet.screens[screenIndex] = screen;
          saveLocalScreenSets(localScreenSets);
          break;
        }
      }
      
      return screen;
    }
  },

  // Update a screen set (both screens and app flow)
  async updateScreenSet(prdId: string, screenSet: ScreenSet): Promise<ScreenSet> {
    try {
      console.log(`Updating screen set for PRD ID: ${prdId}`);
      
      // Update app flow
      await this.updateAppFlow(screenSet.appFlow);
      
      // Update all screens
      for (const screen of screenSet.screens) {
        await this.updateScreen(screen);
      }
      
      return screenSet;
    } catch (error) {
      console.error('Error in updateScreenSet:', error);
      
      // Fall back to local storage
      const localScreenSets = getLocalScreenSets();
      const existingIndex = localScreenSets.findIndex(set => set.appFlow.prdId === prdId);
      
      if (existingIndex >= 0) {
        localScreenSets[existingIndex] = screenSet;
      } else {
        localScreenSets.push(screenSet);
      }
      
      saveLocalScreenSets(localScreenSets);
      return screenSet;
    }
  }
};

export default screenService; 