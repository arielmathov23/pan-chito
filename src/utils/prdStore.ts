import { GeneratedPRD } from './prdGenerator';
import { Brief, briefStore } from './briefStore';

const STORAGE_KEY = 'pan-chito-prds';

export interface PRD {
  id: string;
  briefId: string;
  featureSetId: string;
  overview?: string;
  goals?: string;
  userFlows?: string;
  requirements?: string;
  constraints?: string;
  timeline?: string;
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
    console.log(`prdStore.getPRD: Looking for PRD with ID: ${id}`);
    if (!id) {
      console.error('prdStore.getPRD: Invalid ID provided');
      return null;
    }
    
    const prds = prdStore.getPRDs();
    console.log(`prdStore.getPRD: Found ${prds.length} PRDs in storage`);
    
    // Log all PRD IDs for debugging
    if (prds.length > 0) {
      console.log('prdStore.getPRD: Available PRD IDs:', prds.map(p => p.id));
    }
    
    const foundPRD = prds.find(p => p.id === id);
    console.log(`prdStore.getPRD: PRD ${foundPRD ? 'found' : 'not found'} for ID: ${id}`);
    
    return foundPRD || null;
  },

  getPRDByBriefId: (briefId: string): PRD | null => {
    console.log(`prdStore.getPRDByBriefId: Looking for PRD with briefId: ${briefId}`);
    if (!briefId) {
      console.error('prdStore.getPRDByBriefId: Invalid briefId provided');
      return null;
    }
    
    const prds = prdStore.getPRDs();
    console.log(`prdStore.getPRDByBriefId: Found ${prds.length} PRDs in storage`);
    
    const foundPRD = prds.find(p => p.briefId === briefId);
    console.log(`prdStore.getPRDByBriefId: PRD ${foundPRD ? 'found' : 'not found'} for briefId: ${briefId}`);
    
    return foundPRD || null;
  },

  savePRD: (briefId: string, featureSetId: string, content: GeneratedPRD): PRD => {
    console.log(`prdStore.savePRD: Saving PRD for briefId: ${briefId}`);
    
    const prds = prdStore.getPRDs();
    const brief = briefStore.getBrief(briefId);
    
    if (!brief) {
      console.warn(`prdStore.savePRD: Brief not found for ID: ${briefId}`);
    }
    
    // Check if a PRD already exists for this brief
    const existingIndex = prds.findIndex(p => p.briefId === briefId);
    console.log(`prdStore.savePRD: Existing PRD ${existingIndex >= 0 ? 'found' : 'not found'} for briefId: ${briefId}`);
    
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
      console.log(`prdStore.savePRD: Updated existing PRD with ID: ${newPRD.id}`);
    } else {
      // Add new PRD
      prds.push(newPRD);
      console.log(`prdStore.savePRD: Added new PRD with ID: ${newPRD.id}`);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prds));
    console.log(`prdStore.savePRD: Saved PRDs to localStorage, total count: ${prds.length}`);
    
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