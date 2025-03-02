import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { FeatureSet, featureStore } from '../../utils/featureStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { prdService } from '../../services/prdService';
import { withAuth } from '../../middleware/withAuth';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { Brief, briefService } from '../../services/briefService';
import { featureService } from '../../services/featureService';
import { techDocStore } from '../../utils/techDocStore';
import isMockData from '../../utils/mockDetector';
import screenService from '../../services/screenService';

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
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBriefs, setProjectBriefs] = useState<Record<string, any[]>>({});
  const [projectFeatureSets, setProjectFeatureSets] = useState<Record<string, any[]>>({});
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Calculate project progress based on completed stages
  const calculateProjectProgress = async (
    briefs: any[], 
    featureSets: any[], 
    prds: any[]
  ) => {
    if (!briefs.length) return 0; // No brief yet
    
    if (!featureSets.length) return 1; // Has brief, next is ideation
    
    // Check if PRD exists
    if (!prds.length) return 2; // Has features, next is PRD
    
    // Check if screens exist for any PRD
    try {
      const screenPromises = prds.map(prd => screenService.getScreenSetByPrdId(prd.id));
      const screenResults = await Promise.all(screenPromises);
      const hasScreens = screenResults.some(result => result !== null);
      
      if (!hasScreens) return 3; // Has PRD, next is screens
      
      // For now, we'll stop at screens stage since tech docs 
      // haven't been migrated to Supabase yet
      return 4; // Has screens, next is tech docs
      
      // TODO: Update tech docs check when migrated to Supabase
      /*
      // Check if tech docs exist for any PRD
      const hasTechDocs = prds.some(prd => {
        return techDocStore.getTechDocByPrdId(prd.id);
      });
      
      if (!hasTechDocs) return 4; // Has screens, next is tech docs
      
      return 5; // Has tech docs, all stages completed
      */
    } catch (error) {
      console.error('Error checking for screens:', error);
      return 3; // Default to PRD stage if there's an error
    }
  };

  const loadProjects = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch projects
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
      
      // Initialize state objects
      const briefsByProject: Record<string, any[]> = {};
      const featureSetsByProject: Record<string, any[]> = {};
      
      // Fetch briefs and feature sets for each project
      const projectPromises = projectsData.map(async (project) => {
        try {
          // Fetch briefs for this project
          const briefs = await briefService.getBriefsByProjectId(project.id);
          // Store briefs in state object
          briefsByProject[project.id] = briefs;
          
          // Initialize feature sets array for this project
          featureSetsByProject[project.id] = [];
          
          // Fetch feature sets and PRDs for each brief in parallel
          const briefPromises = briefs.map(async (brief) => {
            try {
              // Get feature set for this brief
              const featureSet = await featureService.getFeatureSetByBriefId(brief.id);
              
              // If feature set exists, add it to the project's feature sets
              if (featureSet) {
                featureSetsByProject[project.id].push(featureSet);
              }
              
              // Get PRDs for this brief
              const prds = await prdService.getPRDsByBriefId(brief.id);
              
              return {
                brief,
                featureSet,
                prds
              };
            } catch (error) {
              console.error(`Error loading data for brief ${brief.id}:`, error);
              return {
                brief,
                featureSet: null,
                prds: []
              };
            }
          });
          
          const briefResults = await Promise.all(briefPromises);
          
          // Calculate project progress
          const projectProgress = await calculateProjectProgress(
            briefResults.map(r => r.brief),
            briefResults.map(r => r.featureSet).filter(Boolean),
            briefResults.flatMap(r => r.prds)
          );
          
          // Update project progress in state
          setProjectProgress(prev => ({
            ...prev,
            [project.id]: projectProgress
          }));
          
        } catch (error) {
          console.error(`Error loading data for project ${project.id}:`, error);
        }
      });
      
      await Promise.all(projectPromises);
      
      // Update state with all briefs and feature sets
      setProjectBriefs(briefsByProject);
      setProjectFeatureSets(featureSetsByProject);
      
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Add router event handlers for navigation
    router.events.on('routeChangeComplete', loadProjects);
    
    // Use a flag to prevent multiple reloads when switching tabs
    let lastFocusTime = 0;
    const handleFocus = () => {
      const now = Date.now();
      // Only reload if it's been at least 30 seconds since the last reload
      if (now - lastFocusTime > 30000) {
        lastFocusTime = now;
        loadProjects();
      }
    };
    
    // Add event listener for focus with debounce
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', loadProjects);
    };
  }, [router.events, user]);

  const getProjectStage = (project: Project, briefs: any[]) => {
    // Use the pre-calculated progress from state if available
    if (projectProgress[project.id] !== undefined) {
      return projectProgress[project.id];
    }
    
    // If no pre-calculated progress is available, default to brief stage
    // This is a safety fallback that should rarely be used since we calculate
    // progress during loadProjects
    if (!briefs.length) return 0; // No brief yet
    return 1; // Has brief, assume next is ideation
  };

  const getStageStatus = (project: Project, briefs: any[], stageIndex: number) => {
    const currentStage = getProjectStage(project, briefs);
    
    if (stageIndex < currentStage) return 'completed';
    if (stageIndex === currentStage) return 'active';
    return 'upcoming';
  };

  // Helper function to get stage color based on stage ID and status
  const getStageColor = (stageId: string, status: string) => {
    // Use green color scheme for all stages
    if (status === 'completed') return { bg: COLORS.project.light, text: COLORS.project.primary, border: COLORS.project.primary };
    if (status === 'active') return { bg: COLORS.project.light, text: COLORS.project.primary, border: COLORS.project.primary };
    return { bg: COLORS.neutral.lighter, text: COLORS.neutral.medium, border: 'transparent' };
  };

  // Function to handle PRD navigation
  const handlePRDNavigation = async (projectId: string) => {
    try {
      // Navigate directly to the new PRD page with the project ID
      router.push(`/prd/new?projectId=${projectId}`);
    } catch (error) {
      console.error('Error navigating to PRD:', error);
      // Default to the project page if there's an error
      router.push(`/project/${projectId}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F533A]"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

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

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F533A]"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-16 bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-8 h-8 text-[#4b5563]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-4">Start building your next great product</h2>
            <p className="text-[#4b5563] mb-10 max-w-md mx-auto">Create comprehensive documentation that transforms your ideas into well-structured products. Plan smarter, build faster.</p>
            <Link
              href="/project/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-all duration-200 shadow-sm text-white bg-[#0F533A] group"
            >
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create your first project
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/brief/${briefs[0].id}`);
                            }}
                            className="inline-flex items-center justify-center border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ 
                              borderColor: COLORS.project.border,
                              color: COLORS.project.primary,
                              backgroundColor: COLORS.project.light
                            }}
                          >
                            View Brief
                            <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
                        {nextStage > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePRDNavigation(project.id);
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
                        {nextStage > 3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // Use an IIFE to handle the async operation
                              (async () => {
                                // Find a PRD associated with any brief in this project
                                const brief = briefs[0];
                                if (brief) {
                                  try {
                                    // Try to find a PRD for this brief
                                    const prds = await prdService.getPRDsByBriefId(brief.id);
                                    if (prds && prds.length > 0) {
                                      console.log(`Found PRD with ID ${prds[0].id} for brief ${brief.id}`);
                                      router.push(`/screens/${prds[0].id}`);
                                      return;
                                    }
                                    
                                    // Fallback to local store if not found in Supabase
                                    const localPrd = prdStore.getPRDByBriefId(brief.id);
                                    if (localPrd) {
                                      console.log(`Found local PRD with ID ${localPrd.id} for brief ${brief.id}`);
                                      router.push(`/screens/${localPrd.id}`);
                                      return;
                                    }
                                  } catch (error) {
                                    console.error('Error finding PRD:', error);
                                  }
                                }
                                console.error('No PRD found for any brief in this project');
                                router.push(`/project/${project.id}`);
                              })();
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
                            backgroundColor: COLORS.project.primary 
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
                              {nextStage === 0 ? 'Create a Brief to get started' : 
                               nextStage === 1 ? 'Generate features for your product' :
                               nextStage === 2 ? 'Generate PRD based on features' :
                               nextStage === 3 ? 'Generate app screens based on PRD' :
                               nextStage === 4 ? 'Generate technical documentation' :
                               'All steps completed'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // Use an IIFE to handle the async operation
                              (async () => {
                                let url;
                                if (nextStage === 0) {
                                  url = `/brief/new?projectId=${project.id}`;
                                } else if (nextStage === 1) {
                                  url = `/brief/${briefs[0].id}/ideate`;
                                } else if (nextStage === 2) {
                                  url = `/prd/new?projectId=${project.id}`;
                                } else if (nextStage === 3) {
                                  // Find a PRD associated with any brief in this project
                                  const brief = briefs[0];
                                  if (brief) {
                                    try {
                                      // Try to find a PRD for this brief
                                      const prds = await prdService.getPRDsByBriefId(brief.id);
                                      if (prds && prds.length > 0) {
                                        console.log(`Found PRD with ID ${prds[0].id} for brief ${brief.id}`);
                                        url = `/screens/${prds[0].id}`;
                                      } else {
                                        // Fallback to local store if not found in Supabase
                                        const localPrd = prdStore.getPRDByBriefId(brief.id);
                                        if (localPrd) {
                                          console.log(`Found local PRD with ID ${localPrd.id} for brief ${brief.id}`);
                                          url = `/screens/${localPrd.id}`;
                                        } else {
                                          console.error('No PRD found for any brief in this project');
                                          url = `/project/${project.id}`;
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error finding PRD:', error);
                                      url = `/project/${project.id}`;
                                    }
                                  } else {
                                    console.error('No brief found for this project');
                                    url = `/project/${project.id}`;
                                  }
                                } else if (nextStage === 4) {
                                  url = `/docs/${briefs[0].id}`;
                                } else {
                                  url = `/project/${project.id}`;
                                }
                                
                                router.push(url);
                              })();
                            }}
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm text-white hover:opacity-90"
                            style={{ 
                              backgroundColor: '#0F533A',
                              color: 'white'
                            }}
                          >
                            {nextStage === 0 ? 'Create Brief' : 
                             nextStage === 1 ? 'Ideate Features' :
                             nextStage === 2 ? 'Generate PRD' :
                             nextStage === 3 ? 'Generate Screens' :
                             nextStage === 4 ? 'Generate Tech Docs' :
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