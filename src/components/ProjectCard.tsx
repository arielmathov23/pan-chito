import React from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  prdCount: number;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Link href={`/project/${project.id}`}>
      <div className="group relative bg-card hover:bg-accent/40 transition-all duration-300 p-6 rounded-xl shadow-card hover:shadow-card-hover border border-border/40">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 rounded-t-xl group-hover:bg-primary/20 transition-colors" />
        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
        <p className="text-muted-foreground mb-6 line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
              {project.prdCount} PRD{project.prdCount !== 1 ? 's' : ''}
            </span>
          </div>
          <time className="text-muted-foreground" dateTime={project.createdAt}>
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </time>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard; 