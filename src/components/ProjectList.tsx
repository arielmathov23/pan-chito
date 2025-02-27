import React from 'react';
import ProjectCard from './ProjectCard';
import Link from 'next/link';
import EmptyState from './EmptyState';

interface Project {
  id: string;
  name: string;
  description: string;
  prdCount: number;
  createdAt: string;
}

interface ProjectListProps {
  projects: Project[];
}

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
          <p className="text-muted-foreground mt-1">Manage and organize your product documentation</p>
        </div>
        <Link 
          href="/project/new" 
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>
      
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet!"
          description="Create your first project to start organizing your product documentation"
          icon="project"
          action={{
            href: "/project/new",
            text: "Create your first project"
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList; 