import { GeneratedPRD } from './prdGenerator';
import { Brief, briefStore } from './briefStore';

const STORAGE_KEY = 'pan-chito-prds';

export interface PRD {
  id: string;
  briefId: string;
  featureSetId: string;
  title: string;
  content: GeneratedPRD;
  createdAt: string;
  updatedAt: string;
}

export const prdStore = {
  getPRDs: (briefId?: string): PRD[] => {
    if (typeof window === 'undefined') return [];
    const prds = localStorage.getItem(STORAGE_KEY);
    const allPRDs = prds ? JSON.parse(prds) : [];
    
    if (briefId) {
      return allPRDs.filter((prd: PRD) => prd.briefId === briefId);
    }
    
    return allPRDs;
  },

  getPRD: (id: string): PRD | null => {
    const prds = prdStore.getPRDs();
    return prds.find(p => p.id === id) || null;
  },

  getPRDByBriefId: (briefId: string): PRD | null => {
    const prds = prdStore.getPRDs();
    return prds.find(p => p.briefId === briefId) || null;
  },

  savePRD: (briefId: string, featureSetId: string, content: GeneratedPRD): PRD => {
    const prds = prdStore.getPRDs();
    const brief = briefStore.getBrief(briefId);
    
    // Check if a PRD already exists for this brief
    const existingIndex = prds.findIndex(p => p.briefId === briefId);
    
    const now = new Date().toISOString();
    const newPRD: PRD = {
      id: crypto.randomUUID(),
      briefId,
      featureSetId,
      title: brief?.productName || 'Untitled PRD',
      content,
      createdAt: now,
      updatedAt: now
    };
    
    if (existingIndex >= 0) {
      // Update existing PRD
      newPRD.id = prds[existingIndex].id;
      newPRD.createdAt = prds[existingIndex].createdAt;
      prds[existingIndex] = newPRD;
    } else {
      // Add new PRD
      prds.push(newPRD);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prds));
    return newPRD;
  },

  updatePRD: (id: string, updates: Partial<Omit<PRD, 'id' | 'briefId' | 'createdAt'>>): PRD | null => {
    const prds = prdStore.getPRDs();
    const prdIndex = prds.findIndex(p => p.id === id);
    
    if (prdIndex === -1) return null;
    
    prds[prdIndex] = {
      ...prds[prdIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prds));
    return prds[prdIndex];
  },

  deletePRD: (id: string): boolean => {
    const prds = prdStore.getPRDs();
    const initialLength = prds.length;
    
    const filteredPRDs = prds.filter(p => p.id !== id);
    
    if (filteredPRDs.length !== initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPRDs));
      return true;
    }
    
    return false;
  }
}; 