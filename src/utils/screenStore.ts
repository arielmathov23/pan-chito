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
}

export const screenStore = new ScreenStore(); 