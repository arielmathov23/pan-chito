import React from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Select Project
      </label>
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              selectedProjectId === project.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <h3 className="font-medium text-foreground">{project.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectSelector; 