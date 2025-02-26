import { PRDFormData } from "../components/PRDForm";

export interface PRD {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
  formData: PRDFormData;
}

const STORAGE_KEY = 'pan-chito-prds';

export const prdStore = {
  getPRDs: (projectId?: string): PRD[] => {
    if (typeof window === 'undefined') return [];
    const prds = localStorage.getItem(STORAGE_KEY);
    const allPRDs = prds ? JSON.parse(prds) : [];
    
    if (projectId) {
      return allPRDs.filter((prd: PRD) => prd.projectId === projectId);
    }
    
    return allPRDs;
  },

  getPRD: (id: string): PRD | null => {
    const prds = prdStore.getPRDs();
    return prds.find(p => p.id === id) || null;
  },

  savePRD: (projectId: string, formData: PRDFormData, content: string): PRD => {
    const prds = prdStore.getPRDs();
    const newPRD: PRD = {
      id: crypto.randomUUID(),
      projectId,
      title: formData.title,
      content,
      createdAt: new Date().toISOString(),
      formData
    };
    
    prds.push(newPRD);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prds));
    return newPRD;
  }
}; 