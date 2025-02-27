import { v4 as uuidv4 } from 'uuid';

// Define the Screen interface
export interface Screen {
  id: string;
  prdId: string;
  name: string;
  description: string;
  elements: ScreenElement[];
  createdAt: number;
}

// Define the ScreenElement interface
export interface ScreenElement {
  id: string;
  type: string; // e.g., 'button', 'input', 'text', etc.
  properties: Record<string, any>;
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
}

// Define the ScreenSet interface
export interface ScreenSet {
  id: string;
  prdId: string;
  screens: Screen[];
  appFlow: AppFlow;
  createdAt: number;
}

// Create the screen store
class ScreenStore {
  private readonly STORAGE_KEY = 'pan_chito_screens';

  // Get all screen sets
  getScreenSets(): ScreenSet[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) return [];
    return JSON.parse(storedData);
  }

  // Get a specific screen set by ID
  getScreenSet(id: string): ScreenSet | null {
    const screenSets = this.getScreenSets();
    return screenSets.find(set => set.id === id) || null;
  }

  // Get a screen set by PRD ID
  getScreenSetByPrdId(prdId: string): ScreenSet | null {
    const screenSets = this.getScreenSets();
    return screenSets.find(set => set.prdId === prdId) || null;
  }

  // Save a new screen set
  saveScreenSet(prdId: string, screens: Screen[], appFlow: AppFlow): ScreenSet {
    const screenSets = this.getScreenSets();
    
    // Check if a screen set already exists for this PRD
    const existingIndex = screenSets.findIndex(set => set.prdId === prdId);
    
    const newScreenSet: ScreenSet = {
      id: uuidv4(),
      prdId,
      screens,
      appFlow,
      createdAt: Date.now()
    };
    
    if (existingIndex >= 0) {
      // Update existing screen set
      screenSets[existingIndex] = {
        ...newScreenSet,
        id: screenSets[existingIndex].id
      };
    } else {
      // Add new screen set
      screenSets.push(newScreenSet);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(screenSets));
    return newScreenSet;
  }

  // Delete a screen set
  deleteScreenSet(id: string): boolean {
    const screenSets = this.getScreenSets();
    const filteredSets = screenSets.filter(set => set.id !== id);
    
    if (filteredSets.length === screenSets.length) {
      return false; // Nothing was deleted
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSets));
    return true;
  }

  // Delete a screen set by PRD ID
  deleteScreenSetByPrdId(prdId: string): boolean {
    const screenSets = this.getScreenSets();
    const filteredSets = screenSets.filter(set => set.prdId !== prdId);
    
    if (filteredSets.length === screenSets.length) {
      return false; // Nothing was deleted
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSets));
    return true;
  }
}

export const screenStore = new ScreenStore(); 