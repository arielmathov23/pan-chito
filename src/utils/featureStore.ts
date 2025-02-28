export interface Feature {
  id: string;
  title: string;
  description: string;
  userStories?: string[];
  priority: 'must' | 'should' | 'could' | 'wont';
  complexity?: string;
  status?: string;
  briefId: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

export interface FeatureSet {
  id: string;
  briefId: string;
  features: Feature[];
  keyQuestions: string[];
  createdAt: string;
}

const STORAGE_KEY = 'pan-chito-features';

export const featureStore = {
  getFeatureSets: (): FeatureSet[] => {
    if (typeof window === 'undefined') return [];
    const featureSets = localStorage.getItem(STORAGE_KEY);
    return featureSets ? JSON.parse(featureSets) : [];
  },

  getFeatureSetByBriefId: (briefId: string): FeatureSet | null => {
    const featureSets = featureStore.getFeatureSets();
    return featureSets.find(fs => fs.briefId === briefId) || null;
  },

  getFeatureSet: (id: string): FeatureSet | null => {
    const featureSets = featureStore.getFeatureSets();
    return featureSets.find(fs => fs.id === id) || null;
  },

  saveFeatureSet: (briefId: string, features: Feature[], keyQuestions: string[]): FeatureSet => {
    const featureSets = featureStore.getFeatureSets();
    
    // Check if a feature set already exists for this brief
    const existingIndex = featureSets.findIndex(fs => fs.briefId === briefId);
    
    const newFeatureSet: FeatureSet = {
      id: crypto.randomUUID(),
      briefId,
      features,
      keyQuestions,
      createdAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update existing feature set
      featureSets[existingIndex] = newFeatureSet;
    } else {
      // Add new feature set
      featureSets.push(newFeatureSet);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureSets));
    return newFeatureSet;
  },

  updateFeatureSet: (featureSetId: string, updatedFeatureSet: Partial<Omit<FeatureSet, 'id' | 'briefId' | 'createdAt'>>): FeatureSet | null => {
    const featureSets = featureStore.getFeatureSets();
    const featureSetIndex = featureSets.findIndex(fs => fs.id === featureSetId);
    
    if (featureSetIndex === -1) return null;
    
    featureSets[featureSetIndex] = {
      ...featureSets[featureSetIndex],
      ...updatedFeatureSet,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureSets));
    return featureSets[featureSetIndex];
  },

  addFeature: (featureSetId: string, feature: Omit<Feature, 'id' | 'createdAt'>): Feature | null => {
    const featureSets = featureStore.getFeatureSets();
    const featureSetIndex = featureSets.findIndex(fs => fs.id === featureSetId);
    
    if (featureSetIndex === -1) return null;
    
    const newFeature: Feature = {
      ...feature,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    featureSets[featureSetIndex].features.push(newFeature);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureSets));
    
    return newFeature;
  },

  updateFeature: (featureSetId: string, featureId: string, updatedFeature: Partial<Feature>): boolean => {
    const featureSets = featureStore.getFeatureSets();
    const featureSetIndex = featureSets.findIndex(fs => fs.id === featureSetId);
    
    if (featureSetIndex === -1) return false;
    
    const featureIndex = featureSets[featureSetIndex].features.findIndex(f => f.id === featureId);
    
    if (featureIndex === -1) return false;
    
    featureSets[featureSetIndex].features[featureIndex] = {
      ...featureSets[featureSetIndex].features[featureIndex],
      ...updatedFeature
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureSets));
    return true;
  },

  deleteFeature: (featureSetId: string, featureId: string): boolean => {
    const featureSets = featureStore.getFeatureSets();
    const featureSetIndex = featureSets.findIndex(fs => fs.id === featureSetId);
    
    if (featureSetIndex === -1) return false;
    
    const initialLength = featureSets[featureSetIndex].features.length;
    featureSets[featureSetIndex].features = featureSets[featureSetIndex].features.filter(f => f.id !== featureId);
    
    if (featureSets[featureSetIndex].features.length !== initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(featureSets));
      return true;
    }
    
    return false;
  },

  deleteFeatureSet: (id: string): boolean => {
    const featureSets = featureStore.getFeatureSets();
    const initialLength = featureSets.length;
    
    const filteredFeatureSets = featureSets.filter(fs => fs.id !== id);
    
    if (filteredFeatureSets.length !== initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredFeatureSets));
      return true;
    }
    
    return false;
  }
}; 