import { v4 as uuidv4 } from 'uuid';

export interface TechDoc {
  id: string;
  prdId: string;
  techStack: string;
  frontend: string;
  backend: string;
  createdAt: number;
  updatedAt: number;
}

class TechDocStore {
  private techDocs: TechDoc[] = [];
  private storageKey = 'techDocs';

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const storedTechDocs = localStorage.getItem(this.storageKey);
      if (storedTechDocs) {
        try {
          this.techDocs = JSON.parse(storedTechDocs);
        } catch (error) {
          console.error('Error parsing tech docs from localStorage:', error);
          this.techDocs = [];
        }
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.techDocs));
    }
  }

  getTechDoc(id: string): TechDoc | null {
    return this.techDocs.find(doc => doc.id === id) || null;
  }

  getTechDocByPrdId(prdId: string): TechDoc | null {
    return this.techDocs.find(doc => doc.prdId === prdId) || null;
  }

  getAllTechDocs(): TechDoc[] {
    return [...this.techDocs];
  }

  saveTechDoc(prdId: string, techDocData: Omit<TechDoc, 'id' | 'prdId' | 'createdAt' | 'updatedAt'>): TechDoc {
    // Check if a tech doc already exists for this PRD
    const existingTechDoc = this.getTechDocByPrdId(prdId);
    
    if (existingTechDoc) {
      // Update existing tech doc
      const updatedTechDoc = {
        ...existingTechDoc,
        ...techDocData,
        updatedAt: Date.now()
      };
      
      this.techDocs = this.techDocs.map(doc => 
        doc.id === existingTechDoc.id ? updatedTechDoc : doc
      );
      
      this.saveToLocalStorage();
      return updatedTechDoc;
    } else {
      // Create new tech doc
      const newTechDoc: TechDoc = {
        id: uuidv4(),
        prdId,
        ...techDocData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      this.techDocs.push(newTechDoc);
      this.saveToLocalStorage();
      return newTechDoc;
    }
  }

  updateTechDoc(techDoc: TechDoc): TechDoc {
    const index = this.techDocs.findIndex(doc => doc.id === techDoc.id);
    
    if (index !== -1) {
      const updatedTechDoc = {
        ...techDoc,
        updatedAt: Date.now()
      };
      
      this.techDocs[index] = updatedTechDoc;
      this.saveToLocalStorage();
      return updatedTechDoc;
    }
    
    return techDoc;
  }

  deleteTechDoc(id: string): boolean {
    const initialLength = this.techDocs.length;
    this.techDocs = this.techDocs.filter(doc => doc.id !== id);
    
    if (this.techDocs.length !== initialLength) {
      this.saveToLocalStorage();
      return true;
    }
    
    return false;
  }

  deleteAllTechDocsForPRD(prdId: string): boolean {
    const initialLength = this.techDocs.length;
    this.techDocs = this.techDocs.filter(doc => doc.prdId !== prdId);
    
    if (this.techDocs.length !== initialLength) {
      this.saveToLocalStorage();
      return true;
    }
    
    return false;
  }
}

export const techDocStore = new TechDocStore();
