import { v4 as uuidv4 } from 'uuid';

// Define the Screen interface
export interface Screen {
  id: string;
  prdId: string;
  name: string;
  description: string;
  featureId: string;  // Added field to link screen to a specific feature
  elements: ScreenElement[];
  createdAt: number;
  svgWireframe?: string; // SVG wireframe content
}

// Define the ScreenElement interface
export interface ScreenElement {
  id: string;
  type: string; // Check if this is defined as a string or as a union type
  properties: any;
}

// Define the AppFlow interface
export interface AppFlow {
  id: string;
  prdId: string;
  steps: FlowStep[];
  createdAt: number;
}

// Define the FlowStep interface
export interface FlowStep {
  id: string;
  description: string;
  screenId?: string; // Optional reference to a screen
  screenReference?: string; // Optional reference to a screen by name (used during generation)
}

// Define the ScreenSet interface
export interface ScreenSet {
  screens: Screen[];
  appFlow: AppFlow;
}

// Create the screen store
class ScreenStore {
  private screens: Screen[] = [];
  private appFlows: AppFlow[] = [];
  private storageKey = 'screens';
  private appFlowKey = 'appFlows';

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const storedScreens = localStorage.getItem(this.storageKey);
      const storedAppFlows = localStorage.getItem(this.appFlowKey);
      
      if (storedScreens) {
        try {
          this.screens = JSON.parse(storedScreens);
        } catch (error) {
          console.error('Error parsing screens from localStorage:', error);
          this.screens = [];
        }
      }
      
      if (storedAppFlows) {
        try {
          this.appFlows = JSON.parse(storedAppFlows);
        } catch (error) {
          console.error('Error parsing app flows from localStorage:', error);
          this.appFlows = [];
        }
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.screens));
      localStorage.setItem(this.appFlowKey, JSON.stringify(this.appFlows));
    }
  }

  // Get all screen sets
  getScreenSets(): ScreenSet[] {
    const screenSets: ScreenSet[] = [];
    for (const screen of this.screens) {
      const appFlow = this.appFlows.find(flow => flow.prdId === screen.prdId);
      if (appFlow) {
        screenSets.push({
          screens: [screen],
          appFlow: appFlow
        });
      }
    }
    return screenSets;
  }

  // Get a specific screen set by ID
  getScreenSet(id: string): ScreenSet | null {
    const screens = this.screens.filter(screen => screen.prdId === id);
    const appFlow = this.appFlows.find(flow => flow.prdId === id);
    
    if (!appFlow) return null;
    
    return {
      screens,
      appFlow
    };
  }

  // Get a screen set by PRD ID
  getScreenSetByPrdId(prdId: string): ScreenSet | null {
    const screens = this.screens.filter(screen => screen.prdId === prdId);
    const appFlow = this.appFlows.find(flow => flow.prdId === prdId);
    
    if (!appFlow) return null;
    
    return {
      screens,
      appFlow
    };
  }

  // Save a new screen set
  saveScreenSet(prdId: string, screens: Screen[], appFlow: AppFlow): ScreenSet {
    // Remove existing screens and app flow for this PRD
    this.screens = this.screens.filter(screen => screen.prdId !== prdId);
    this.appFlows = this.appFlows.filter(flow => flow.prdId !== prdId);
    
    // Add new screens and app flow
    this.screens.push(...screens);
    this.appFlows.push(appFlow);
    
    this.saveToLocalStorage();
    
    return { screens, appFlow };
  }

  // Delete a screen set
  deleteScreenSet(id: string): boolean {
    const initialScreensLength = this.screens.length;
    const initialAppFlowsLength = this.appFlows.length;
    
    this.screens = this.screens.filter(screen => screen.prdId !== id);
    this.appFlows = this.appFlows.filter(flow => flow.prdId !== id);
    
    if (this.screens.length !== initialScreensLength || this.appFlows.length !== initialAppFlowsLength) {
      this.saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  // Delete a screen set by PRD ID
  deleteScreenSetByPrdId(prdId: string): boolean {
    const initialScreensLength = this.screens.length;
    const initialAppFlowsLength = this.appFlows.length;
    
    this.screens = this.screens.filter(screen => screen.prdId !== prdId);
    this.appFlows = this.appFlows.filter(flow => flow.prdId !== prdId);
    
    if (this.screens.length !== initialScreensLength || this.appFlows.length !== initialAppFlowsLength) {
      this.saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  updateAppFlow(appFlow: AppFlow): AppFlow {
    const index = this.appFlows.findIndex(flow => flow.id === appFlow.id);
    
    if (index !== -1) {
      this.appFlows[index] = appFlow;
      this.saveToLocalStorage();
    }
    
    return appFlow;
  }

  // Update a screen with SVG wireframe
  updateScreenSvgWireframe(screenId: string, svgWireframe: string): Screen | null {
    const index = this.screens.findIndex(screen => screen.id === screenId);
    
    if (index !== -1) {
      this.screens[index] = {
        ...this.screens[index],
        svgWireframe
      };
      this.saveToLocalStorage();
      return this.screens[index];
    }
    
    return null;
  }
}

export const screenStore = new ScreenStore();

// Utility function to normalize screen elements for backward compatibility
export function normalizeScreenElement(element: ScreenElement): ScreenElement {
  // Create a copy to avoid modifying the original
  const normalized = { ...element };
  
  // Ensure properties object exists
  normalized.properties = normalized.properties || {};
  
  // Apply type-specific default properties based on element type
  switch (normalized.type) {
    case 'text':
      // For text elements, infer isHeading from content length if not specified
      if (normalized.properties.isHeading === undefined) {
        normalized.properties.isHeading = normalized.properties.content && 
                                         normalized.properties.content.length < 20;
      }
      // Optional new properties with defaults
      normalized.properties.alignment = normalized.properties.alignment || 'left';
      break;
      
    case 'button':
      // Optional new properties with defaults
      normalized.properties.isFullWidth = normalized.properties.isFullWidth || false;
      normalized.properties.isPrimary = normalized.properties.isPrimary || false;
      break;
      
    case 'input':
      // Optional new properties with defaults
      normalized.properties.inputType = normalized.properties.inputType || 'text';
      normalized.properties.isRequired = normalized.properties.isRequired || false;
      break;
      
    case 'image':
      // For image elements, ensure height has a reasonable default
      normalized.properties.height = normalized.properties.height || 140;
      // Optional new properties with defaults
      normalized.properties.purpose = normalized.properties.purpose || 'illustration';
      break;
  }
  
  return normalized;
}

// Utility function to normalize an entire screen
export function normalizeScreen(screen: Screen): Screen {
  if (!screen) return screen;
  
  return {
    ...screen,
    elements: Array.isArray(screen.elements) 
      ? screen.elements.map(element => normalizeScreenElement(element))
      : []
  };
}

// Utility function to normalize a complete screen set
export function normalizeScreenSet(screenSet: ScreenSet | null): ScreenSet | null {
  if (!screenSet) return null;
  
  return {
    ...screenSet,
    screens: Array.isArray(screenSet.screens) 
      ? screenSet.screens.map(screen => normalizeScreen(screen))
      : []
  };
} 