import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { featureStore } from '../../utils/featureStore';
import { prdStore } from '../../utils/prdStore';
import { techDocStore } from '../../utils/techDocStore';

// Define stages and their display info
const PROJECT_STAGES = [
  { id: 'brief', name: 'Brief', icon: null },
  { id: 'ideation', name: 'Ideation', icon: null },
  { id: 'prd', name: 'PRD', icon: null },
  { id: 'screens', name: 'Screens', icon: null },
  { id: 'docs', name: 'Tech Docs', icon: null }
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
  // Documentation colors - purple
  docs: {
    primary: '#8b5cf6', // Purple
    secondary: '#a78bfa',
    light: '#f5f3ff',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  // Status colors
  status: {
    completed: '#3b82f6', // Blue (changed from green)
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
  const [projectFeatureSets, setProjectFeatureSets] = useState<Record<string, any[]>>({});

  const loadProjects = () => {
    const loadedProjects = projectStore.getProjects();
    setProjects(loadedProjects);
    
    // Load briefs for each project
    const briefsByProject: Record<string, Brief[]> = {};
    const featureSetsByProject: Record<string, any[]> = {};
    
    loadedProjects.forEach(project => {
      const projectBriefs = briefStore.getBriefs(project.id);
      briefsByProject[project.id] = projectBriefs;
      
      // Load feature sets for each project
      let allFeatureSets: any[] = [];
      
      projectBriefs.forEach(brief => {
        const briefFeatureSet = featureStore.getFeatureSetByBriefId(brief.id);
        if (briefFeatureSet) {
          allFeatureSets.push(briefFeatureSet);
        }
      });
      
      featureSetsByProject[project.id] = allFeatureSets;
    });
    
    setProjectBriefs(briefsByProject);
    setProjectFeatureSets(featureSetsByProject);
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
    
    const featureSets = projectFeatureSets[project.id] || [];
    if (!featureSets.length) return 1; // Has brief, next is ideation
    
    // Check if PRD exists for any brief
    const hasPRD = briefs.some(brief => prdStore.getPRDs(brief.id).length > 0);
    if (!hasPRD) return 2; // Has features, next is PRD
    
    // Check if screens exist for any PRD
    const hasScreens = briefs.some(brief => {
      const prd = prdStore.getPRDs(brief.id)[0];
      return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
    });
    
    if (!hasScreens) return 3; // Has PRD, next is screens
    
    // Check if tech docs exist for any PRD
    const hasTechDocs = briefs.some(brief => {
      const prd = prdStore.getPRDs(brief.id)[0];
      return prd && techDocStore.getTechDocByPrdId(prd.id);
    });
    
    if (!hasTechDocs) return 4; // Has screens, next is tech docs
    
    return 5; // Has tech docs, all stages completed
  };

  const getStageStatus = (project: Project, briefs: Brief[], stageIndex: number) => {
    const currentStage = getProjectStage(project, briefs);
    
    if (stageIndex < currentStage) return 'completed';
    if (stageIndex === currentStage) return 'active';
    return 'upcoming';
  };

  // Helper function to get stage color based on stage ID and status
  const getStageColor = (stageId: string, status: string) => {
    // Use blue color scheme for all stages
    if (status === 'completed') return { bg: COLORS.task.light, text: COLORS.task.primary, border: COLORS.task.primary };
    if (status === 'active') return { bg: COLORS.task.light, text: COLORS.task.primary, border: COLORS.task.primary };
    return { bg: COLORS.neutral.lighter, text: COLORS.neutral.medium, border: 'transparent' };
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
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium hover:bg-[#f0f2f5] transition-colors border border-[#0F533A] text-[#0F533A] bg-white"
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
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Ready to build your digital product?</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">Get all the essential documentation you need before development. Remember: 80% planning, 20% execution is the key to success.</p>
            <Link
              href="/project/new"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm text-white bg-[#0F533A]"
            >
              Create project
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1">
            {projects.map((project) => {
              const briefs = projectBriefs[project.id] || [];
              const currentStage = getProjectStage(project, briefs);
              const nextStage = currentStage < PROJECT_STAGES.length ? currentStage : -1;
              const progress = Math.min(100, Math.round((currentStage / PROJECT_STAGES.length) * 100));
              
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/project/${project.id}`)}
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
                                backgroundColor: COLORS.task.light, 
                                color: COLORS.task.primary 
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/brief/${briefs[0].id}`);
                            }}
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
                          </button>
                        )}
                        {briefs.length > 0 && briefs.some(brief => prdStore.getPRDs(brief.id).length > 0) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/prd/${briefs.find(brief => prdStore.getPRDs(brief.id).length > 0)?.id}`);
                            }}
                            className="inline-flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ 
                              borderColor: COLORS.project.border,
                              color: COLORS.project.primary,
                              backgroundColor: COLORS.project.light
                            }}
                          >
                            View PRD
                            <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
                        {/* Add Screens Link */}
                        {briefs.length > 0 && briefs.some(brief => {
                          const prd = prdStore.getPRDs(brief.id)[0];
                          return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                        }) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const brief = briefs.find(brief => {
                                const prd = prdStore.getPRDs(brief.id)[0];
                                return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                              });
                              if (brief) {
                                const prds = prdStore.getPRDs(brief.id);
                                if (prds.length > 0) {
                                  router.push(`/screens/${prds[0].id}`);
                                }
                              }
                            }}
                            className="inline-flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ 
                              borderColor: COLORS.docs.border,
                              color: COLORS.docs.primary,
                              backgroundColor: COLORS.docs.light
                            }}
                          >
                            View Screens
                            <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/project/${project.id}`);
                          }}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#e5e7eb] text-[#6b7280] hover:text-[#4b5563] hover:bg-[#f0f2f5]"
                        >
                          View Details
                          <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
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
                            backgroundColor: COLORS.task.primary 
                          }}
                        ></div>
                      </div>
                      
                      {/* Project Timeline */}
                      <div className="grid grid-cols-5 gap-2 relative">
                        {PROJECT_STAGES.map((stage, index) => {
                          const status = getStageStatus(project, briefs, index);
                          const colors = getStageColor(stage.id, status);
                          
                          return (
                            <div 
                              key={stage.id} 
                              className="flex flex-col items-center relative"
                            >
                              <div 
                                className="w-full py-2 px-1 rounded-md text-center text-xs font-medium flex items-center justify-center transition-all duration-200"
                                style={{ 
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderBottom: `2px solid ${colors.border}`,
                                  boxShadow: status === 'active' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                }}
                              >
                                {stage.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Next Action Section */}
                    {nextStage >= 0 && (
                      <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-[#4b5563]">Next Step</h4>
                            <p className="text-xs text-[#6b7280] mt-1">
                              {!briefs.length ? 'Create a Brief to get started' : 
                               !projectFeatureSets[project.id]?.length ? 'Generate features for your product' :
                               !briefs.some(brief => prdStore.getPRDs(brief.id).length > 0) ? 'Generate PRD based on features' :
                               !briefs.some(brief => {
                                 const prd = prdStore.getPRDs(brief.id)[0];
                                 return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                               }) ? 'Generate app screens based on PRD' :
                               !briefs.some(brief => {
                                 const prd = prdStore.getPRDs(brief.id)[0];
                                 return prd && techDocStore.getTechDocByPrdId(prd.id);
                               }) ? 'Generate technical documentation' :
                               'All steps completed'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = !briefs.length ? 
                                `/brief/new?projectId=${project.id}` : 
                                !projectFeatureSets[project.id]?.length ? 
                                `/brief/${briefs[0].id}/ideate` :
                                !briefs.some(brief => prdStore.getPRDs(brief.id).length > 0) ?
                                `/prd/${briefs[0].id}` :
                                !briefs.some(brief => {
                                  const prd = prdStore.getPRDs(brief.id)[0];
                                  return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                                }) ?
                                `/screens/${(() => {
                                  const brief = briefs.find(b => prdStore.getPRDs(b.id).length > 0);
                                  return brief ? prdStore.getPRDs(brief.id)[0].id : '';
                                })()}` :
                                !briefs.some(brief => {
                                  const prd = prdStore.getPRDs(brief.id)[0];
                                  return prd && techDocStore.getTechDocByPrdId(prd.id);
                                }) ?
                                `/docs/${(() => {
                                  const brief = briefs.find(b => prdStore.getPRDs(b.id).length > 0);
                                  return brief ? prdStore.getPRDs(brief.id)[0].id : '';
                                })()}` :
                                `/project/${project.id}`;
                              router.push(url);
                            }}
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm text-white hover:opacity-90"
                            style={{ 
                              backgroundColor: !briefs.length ? '#0F533A' : 
                                              !projectFeatureSets[project.id]?.length ? '#3b82f6' : 
                                              !briefs.some(brief => prdStore.getPRDs(brief.id).length > 0) ? '#0F533A' :
                                              !briefs.some(brief => {
                                                const prd = prdStore.getPRDs(brief.id)[0];
                                                return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                                              }) ? '#8b5cf6' :
                                              !briefs.some(brief => {
                                                const prd = prdStore.getPRDs(brief.id)[0];
                                                return prd && techDocStore.getTechDocByPrdId(prd.id);
                                              }) ? '#0F533A' :
                                              '#0F533A',
                              color: 'white'
                            }}
                          >
                            {!briefs.length ? 'Create Brief' : 
                             !projectFeatureSets[project.id]?.length ? 'Ideate Features' :
                             !briefs.some(brief => prdStore.getPRDs(brief.id).length > 0) ? 'Generate PRD' :
                             !briefs.some(brief => {
                               const prd = prdStore.getPRDs(brief.id)[0];
                               return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                             }) ? 'Generate Screens' :
                             !briefs.some(brief => {
                               const prd = prdStore.getPRDs(brief.id)[0];
                               return prd && techDocStore.getTechDocByPrdId(prd.id);
                             }) ? 'Generate Tech Docs' :
                             'View Project Details'}
                            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
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