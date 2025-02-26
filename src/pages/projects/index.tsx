import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';

// Define stages and their display info
const PROJECT_STAGES = [
  { id: 'brief', name: 'Brief', icon: null },
  { id: 'ideation', name: 'Ideation', icon: null },
  { id: 'draftPrd', name: 'Draft PRD', icon: null },
  { id: 'finalPrd', name: 'Final PRD', icon: null },
  { id: 'docs', name: 'Docs', icon: null },
  { id: 'screens', name: 'Screens', icon: null }
];

// Color scheme for the application
const COLORS = {
  // Main project colors - green
  project: {
    primary: '#0F533A', // Dark green
    secondary: '#16a34a', // Medium green
    light: '#e6f0eb', // Light green
    border: 'rgba(15, 83, 58, 0.2)',
  },
  // Task colors - blue
  task: {
    primary: '#3b82f6', // Blue
    secondary: '#60a5fa',
    light: '#eff6ff',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  // Status colors
  status: {
    completed: '#10b981', // Green
    active: '#3b82f6', // Blue
    upcoming: '#9ca3af', // Gray
  },
  // Neutral colors
  neutral: {
    darker: '#111827',
    dark: '#4b5563',
    medium: '#6b7280',
    light: '#e5e7eb',
    lighter: '#f0f2f5',
  }
};

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBriefs, setProjectBriefs] = useState<Record<string, Brief[]>>({});

  const loadProjects = () => {
    const loadedProjects = projectStore.getProjects();
    setProjects(loadedProjects);
    
    // Load briefs for each project
    const briefsByProject: Record<string, Brief[]> = {};
    loadedProjects.forEach(project => {
      briefsByProject[project.id] = briefStore.getBriefs(project.id);
    });
    setProjectBriefs(briefsByProject);
  };

  useEffect(() => {
    loadProjects();

    // Add event listener for focus to refresh projects
    window.addEventListener('focus', loadProjects);
    
    // Add router event handlers
    router.events.on('routeChangeComplete', loadProjects);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', loadProjects);
      router.events.off('routeChangeComplete', loadProjects);
    };
  }, [router.events]);

  const getProjectStage = (project: Project, briefs: Brief[]) => {
    if (!briefs.length) return 0; // No brief yet
    return 1; // Has brief, next is ideation
    // Future stages would be implemented here based on actual data
  };

  const getStageStatus = (project: Project, briefs: Brief[], stageIndex: number) => {
    const currentStage = getProjectStage(project, briefs);
    
    if (stageIndex < currentStage) return 'completed';
    if (stageIndex === currentStage) return 'active';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Projects</h1>
            <p className="text-[#4b5563] mt-2 text-sm">Manage your product documentation workflow</p>
          </div>
          <Link
            href="/project/new"
            className="inline-flex items-center justify-center text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm"
            style={{ backgroundColor: COLORS.project.primary }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Project
          </Link>
        </header>

        {projects.length === 0 ? (
          <div className="mt-16 bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#4b5563]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">No projects yet</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">Create your first project to get started with product documentation</p>
            <Link
              href="/project/new"
              className="inline-flex items-center justify-center text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm"
              style={{ backgroundColor: COLORS.project.primary }}
            >
              Create project
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1">
            {projects.map((project) => {
              const briefs = projectBriefs[project.id] || [];
              const currentStage = getProjectStage(project, briefs);
              const nextStage = currentStage < PROJECT_STAGES.length - 1 ? currentStage + 1 : -1;
              const progress = Math.round((currentStage / (PROJECT_STAGES.length - 1)) * 100);
              
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6 sm:p-8">
                    {/* Project Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-[#111827] group-hover:text-[#0F533A] transition-colors">{project.name}</h3>
                          {currentStage > 0 && (
                            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                              style={{ 
                                backgroundColor: COLORS.project.light, 
                                color: COLORS.project.primary 
                              }}>
                              {currentStage} / {PROJECT_STAGES.length} completed
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-[#4b5563] mt-1 text-sm line-clamp-2 max-w-2xl">{project.description}</p>
                        )}
                        <div className="text-xs text-[#6b7280] mt-3 flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-3 sm:self-start">
                        {briefs.length > 0 && (
                          <Link
                            href={`/brief/${briefs[0].id}`}
                            className="inline-flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ 
                              borderColor: COLORS.task.border,
                              color: COLORS.task.primary,
                              backgroundColor: COLORS.task.light
                            }}
                          >
                            View Brief
                            <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Link>
                        )}
                        <Link
                          href={`/project/${project.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ 
                            backgroundColor: COLORS.project.primary,
                            color: 'white'
                          }}
                        >
                          View Details
                          <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress Section */}
                    <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-[#4b5563]">Project Progress</h4>
                        <div className="text-xs font-medium text-[#6b7280]">
                          {progress}% Complete
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#f0f2f5] h-2 rounded-full overflow-hidden mb-5">
                        <div 
                          className="h-2 rounded-full transition-all duration-300 ease-in-out"
                          style={{ 
                            width: `${progress}%`, 
                            backgroundColor: COLORS.project.primary 
                          }}
                        ></div>
                      </div>
                      
                      {/* Project Timeline */}
                      <div className="grid grid-cols-6 gap-2">
                        {PROJECT_STAGES.map((stage, index) => {
                          const status = getStageStatus(project, briefs, index);
                          
                          // Set colors based on status
                          const bgColor = status === 'completed' ? COLORS.project.light : 
                                         status === 'active' ? COLORS.project.light : 
                                         COLORS.neutral.lighter;
                          
                          const textColor = status === 'completed' ? COLORS.project.primary : 
                                          status === 'active' ? COLORS.project.primary : 
                                          COLORS.neutral.medium;
                          
                          const borderColor = status === 'completed' ? COLORS.project.primary : 
                                            status === 'active' ? COLORS.project.primary : 
                                            'transparent';
                          
                          return (
                            <div 
                              key={stage.id} 
                              className="flex flex-col items-center"
                            >
                              <div 
                                className="w-full py-2 px-1 rounded-md text-center text-xs font-medium mb-1 flex items-center justify-center"
                                style={{ 
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  borderBottom: `2px solid ${borderColor}`
                                }}
                              >
                                {stage.name}
                              </div>
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  backgroundColor: status === 'completed' ? COLORS.project.primary : 
                                                  status === 'active' ? 'white' : 
                                                  COLORS.neutral.lighter,
                                  border: `2px solid ${status === 'completed' || status === 'active' ? 
                                                      COLORS.project.primary : 
                                                      COLORS.neutral.light}`
                                }}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Next Action Section */}
                    {nextStage >= 0 && (
                      <div className="mt-6 pt-6 border-t border-[#e5e7eb] flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium text-[#4b5563]">Next Step</h4>
                          <p className="text-xs text-[#6b7280] mt-1">
                            {currentStage === 0 ? 'Create a Brief to get started' : 
                             `Move to ${PROJECT_STAGES[nextStage].name} stage`}
                          </p>
                        </div>
                        <Link
                          href={currentStage === 0 ? `/brief/new?projectId=${project.id}` : `/project/${project.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                          style={{ 
                            backgroundColor: COLORS.project.light,
                            color: COLORS.project.primary
                          }}
                        >
                          {currentStage === 0 ? 'Create Brief' : 'Continue'}
                          <svg className="w-3 h-3 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 