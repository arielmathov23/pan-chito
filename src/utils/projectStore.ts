export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

const STORAGE_KEY = 'pan-chito-projects';

export const projectStore = {
  getProjects: (): Project[] => {
    if (typeof window === 'undefined') return [];
    const projects = localStorage.getItem(STORAGE_KEY);
    return projects ? JSON.parse(projects) : [];
  },

  getProject: (id: string): Project | null => {
    const projects = projectStore.getProjects();
    return projects.find(p => p.id === id) || null;
  },

  saveProject: (project: Omit<Project, 'id' | 'createdAt'>): Project => {
    const projects = projectStore.getProjects();
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
  },
  
  deleteProject: (id: string): boolean => {
    const projects = projectStore.getProjects();
    const initialLength = projects.length;
    
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length !== initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProjects));
      return true; // Project was found and deleted
    }
    
    return false; // Project was not found
  }
}; 