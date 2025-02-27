import { BriefFormData } from "../components/BriefForm";
import { GeneratedBrief } from "./briefGenerator";

export interface Brief {
  id: string;
  projectId: string;
  productName: string;
  content: string;
  briefData: GeneratedBrief;
  createdAt: string;
  formData: BriefFormData;
  platforms?: string[];
}

const STORAGE_KEY = 'pan-chito-briefs';

// Ensure all fields in the brief are strings
function ensureStringFields(brief: any): GeneratedBrief {
  const result: GeneratedBrief = {} as GeneratedBrief;
  
  for (const key of Object.keys(brief)) {
    const value = brief[key];
    if (typeof value === 'string') {
      result[key as keyof GeneratedBrief] = value;
    } else {
      // Convert non-string values to formatted strings
      result[key as keyof GeneratedBrief] = JSON.stringify(value, null, 2);
    }
  }
  
  return result;
}

export const briefStore = {
  getBriefs: (projectId?: string): Brief[] => {
    if (typeof window === 'undefined') return [];
    const briefs = localStorage.getItem(STORAGE_KEY);
    const allBriefs = briefs ? JSON.parse(briefs) : [];
    
    if (projectId) {
      return allBriefs.filter((brief: Brief) => brief.projectId === projectId);
    }
    
    return allBriefs;
  },

  getBrief: (id: string): Brief | null => {
    const briefs = briefStore.getBriefs();
    return briefs.find(b => b.id === id) || null;
  },

  saveBrief: (projectId: string, formData: BriefFormData, content: string): Brief => {
    const briefs = briefStore.getBriefs();
    
    // Parse the JSON content to get structured brief data
    let briefData: GeneratedBrief;
    try {
      const parsedData = JSON.parse(content);
      // Ensure all fields are strings
      briefData = ensureStringFields(parsedData);
    } catch (error) {
      console.error('Error parsing brief JSON:', error);
      // Fallback to a default structure if parsing fails
      briefData = {
        executiveSummary: `${formData.productName} - Brief`,
        problemStatement: formData.problemStatement,
        targetUsers: formData.targetUsers,
        existingSolutions: formData.existingSolutions || '',
        proposedSolution: formData.proposedSolution,
        productObjectives: formData.productObjectives,
        keyFeatures: formData.keyFeatures,
        marketAnalysis: formData.marketAnalysis || '',
        technicalRisks: '',
        businessRisks: '',
        implementationStrategy: '',
        successMetrics: ''
      };
    }
    
    const newBrief: Brief = {
      id: crypto.randomUUID(),
      projectId,
      productName: formData.productName,
      content,
      briefData,
      createdAt: new Date().toISOString(),
      formData
    };
    
    briefs.push(newBrief);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs));
    return newBrief;
  },

  updateBrief: (id: string, updatedBriefData: GeneratedBrief): Brief | null => {
    const briefs = briefStore.getBriefs();
    const briefIndex = briefs.findIndex(b => b.id === id);
    
    if (briefIndex === -1) return null;
    
    // Ensure all fields are strings
    const processedBriefData = ensureStringFields(updatedBriefData);
    
    // Update the brief
    briefs[briefIndex] = {
      ...briefs[briefIndex],
      briefData: processedBriefData,
      content: JSON.stringify(processedBriefData)
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs));
    return briefs[briefIndex];
  }
}; 