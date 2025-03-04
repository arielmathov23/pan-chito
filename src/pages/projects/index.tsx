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
import { techDocService } from '../../services/techDocService';
import isMockData from '../../utils/mockDetector';
import screenService from '../../services/screenService';
import { projectLimitService } from '../../services/projectLimitService';
import { implementationGuideService } from '../../services/implementationGuideService';
import { useFeedbackModal } from '../../hooks/useFeedbackModal';
import FeedbackModal from '../../components/FeedbackModal';

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

// Function to generate markdown content for project documentation
const generateProjectMarkdown = (project: Project, brief: Brief, prd: PRD) => {
  let markdown = `# ${project.name}\n\n`;
  
  if (project.description) {
    markdown += `${project.description}\n\n`;
  }
  
  // Add Brief section
  markdown += `## Brief\n\n`;
  
  if (brief.brief_data) {
    if (brief.brief_data.problemStatement) {
      markdown += `### Problem Statement\n${brief.brief_data.problemStatement}\n\n`;
    }
    
    if (brief.brief_data.targetUsers) {
      markdown += `### Target Users\n${brief.brief_data.targetUsers}\n\n`;
    }
    
    if (brief.brief_data.productObjectives) {
      markdown += `### Product Objectives\n${brief.brief_data.productObjectives}\n\n`;
    }
  }
  
  // Add PRD section
  markdown += `## Product Requirements\n\n`;
  
  if (prd.content && prd.content.sections) {
    prd.content.sections.forEach(section => {
      markdown += `### ${section.featureName}\n\n`;
      
      markdown += `**Priority**: ${section.featurePriority}\n\n`;
      
      if (section.overview) {
        markdown += `#### Overview\n`;
        markdown += `${section.overview.purpose}\n\n`;
        
        if (section.overview.successMetrics && section.overview.successMetrics.length) {
          markdown += `**Success Metrics**:\n`;
          section.overview.successMetrics.forEach(metric => {
            markdown += `- ${metric}\n`;
          });
          markdown += '\n';
        }
      }
      
      if (section.userStories && section.userStories.length) {
        markdown += `#### User Stories\n`;
        section.userStories.forEach(story => {
          markdown += `- ${story}\n`;
        });
        markdown += '\n';
      }
    });
  }
  
  // Add Technical Documentation section if available
  const techDoc = techDocStore.getTechDocByPrdId(prd.id);
  if (techDoc) {
    markdown += `## Technical Documentation\n\n`;
    
    if (techDoc.content && techDoc.content.platform) {
      markdown += `### Platform\n`;
      if (techDoc.content.platform.targets && techDoc.content.platform.targets.length) {
        markdown += `**Targets**:\n`;
        techDoc.content.platform.targets.forEach((target: string) => {
          markdown += `- ${target}\n`;
        });
        markdown += '\n';
      }
      if (techDoc.content.platform.requirements && techDoc.content.platform.requirements.length) {
        markdown += `**Requirements**:\n`;
        techDoc.content.platform.requirements.forEach((req: string) => {
          markdown += `- ${req}\n`;
        });
        markdown += '\n';
      }
    }
    
    if (techDoc.content && techDoc.content.frontend) {
      markdown += `### Frontend\n`;
      markdown += JSON.stringify(techDoc.content.frontend, null, 2);
      markdown += '\n\n';
    }
    
    if (techDoc.content && techDoc.content.backend) {
      markdown += `### Backend\n`;
      markdown += JSON.stringify(techDoc.content.backend, null, 2);
      markdown += '\n\n';
    }
    
    if (techDoc.content && techDoc.content.api) {
      markdown += `### API\n`;
      markdown += JSON.stringify(techDoc.content.api, null, 2);
      markdown += '\n\n';
    }
    
    if (techDoc.content && techDoc.content.database) {
      markdown += `### Database\n`;
      markdown += JSON.stringify(techDoc.content.database, null, 2);
      markdown += '\n\n';
    }
    
    if (techDoc.content && techDoc.content.deployment) {
      markdown += `### Deployment\n`;
      markdown += JSON.stringify(techDoc.content.deployment, null, 2);
      markdown += '\n\n';
    }
  }
  
  return markdown;
};

export default function Projects() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBriefs, setProjectBriefs] = useState<Record<string, any[]>>({});
  const [projectFeatureSets, setProjectFeatureSets] = useState<Record<string, any[]>>({});
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [limitStatus, setLimitStatus] = useState<{
    canCreateProject: boolean;
    currentProjects: number;
    maxProjects: number;
  } | null>(null);
  const [projectsWithGuides, setProjectsWithGuides] = useState<string[]>([]);

  const { showModal, closeModal } = useFeedbackModal(projectsWithGuides.length > 0);

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
      
      // Check if tech docs exist for any PRD
      // First check Supabase using techDocService
      const techDocPromises = prds.map(prd => techDocService.getTechDocByPrdId(prd.id));
      const techDocResults = await Promise.all(techDocPromises);
      const hasTechDocsInSupabase = techDocResults.some(result => result !== null);
      
      if (hasTechDocsInSupabase) {
        return 5; // Has tech docs in Supabase, all stages completed
      }
      
      // Fallback to local storage if not found in Supabase
      const hasTechDocsInLocalStorage = prds.some(prd => {
        return techDocStore.getTechDoc(prd.id);
      });
      
      if (!hasTechDocsInLocalStorage && !hasTechDocsInSupabase) return 4; // Has screens, next is tech docs
      
      return 5; // Has tech docs, all stages completed
    } catch (error) {
      console.error('Error checking for screens or tech docs:', error);
      return 3; // Default to PRD stage if there's an error
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      
      // Fetch projects
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
      
      // Check project limits
      try {
        const status = await projectLimitService.checkCanCreateProject();
        setLimitStatus(status);
      } catch (limitError) {
        console.error('Error checking project limits:', limitError);
        // Set a default limit status to allow navigation to continue
        setLimitStatus({
          canCreateProject: true,
          currentProjects: projectsData.length,
          maxProjects: 5
        });
      }
      
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
      
      // Set loading to false after successful data loading
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error loading projects:', error);
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

  useEffect(() => {
    const fetchProjectsWithGuides = async () => {
      if (!projects) return;
      const guidesPromises = projects.map(project =>
        implementationGuideService.getGuideByProjectId(project.id)
      );
      const guides = await Promise.all(guidesPromises);
      const projectIds = guides
        .map((guide, index) => guide ? projects[index].id : null)
        .filter((id): id is string => id !== null);
      setProjectsWithGuides(projectIds);
    };
    
    fetchProjectsWithGuides();
  }, [projects]);

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
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Projects</h1>
            <p className="text-[#6b7280] mt-2">Manage your product development projects</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {limitStatus && projects.length > 0 && (
              <div className="mr-4 text-right">
                <p className="text-sm text-[#6b7280]">
                  {limitStatus.currentProjects} of {limitStatus.maxProjects} projects used
                </p>
                {!limitStatus.canCreateProject && (
                  <Link href="/upgrade" className="text-sm text-[#0F533A] hover:underline">
                    Upgrade for more
                  </Link>
                )}
              </div>
            )}
            
            {projects.length > 0 && (
              <Link 
                href="/project/new" 
                className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium ${
                  limitStatus && !limitStatus.canCreateProject
                    ? 'bg-[#0F533A]/60 text-white cursor-not-allowed'
                    : 'bg-[#0F533A] text-white hover:bg-[#0F533A]/90 transition-colors'
                }`}
                onClick={(e) => {
                  if (limitStatus && !limitStatus.canCreateProject) {
                    e.preventDefault();
                    router.push('/upgrade');
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F533A]"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-4 bg-white rounded-2xl shadow-sm p-6">
            <div className="w-12 h-12 bg-[#0F533A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#111827] mb-2 text-center">Start building your next great product</h2>
            <p className="text-[#6b7280] mb-6 max-w-xl mx-auto text-center">Transform your ideas into reality with our streamlined development process.</p>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
              {/* Step 1 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:border-[#0F533A]/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#0F533A]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-5 h-5 text-[#0F533A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-1.5 text-center">From Idea to Product</h3>
                <p className="text-[#6b7280] text-center text-sm">Define and shape your product vision. We'll help you transform your concept into a clear, actionable plan.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:border-[#0F533A]/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#0F533A]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-5 h-5 text-[#0F533A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-1.5 text-center">Documentation</h3>
                <p className="text-[#6b7280] text-center text-sm">Generate comprehensive documentation including PRDs, tech specs, and user stories automatically.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:border-[#0F533A]/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#0F533A]/10 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-5 h-5 text-[#0F533A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-1.5 text-center">Start Building</h3>
                <p className="text-[#6b7280] text-center text-sm mb-3">Export your documentation and start building in your favorite development environment.</p>
                
                <div className="flex flex-col items-center space-y-3">
                  {/* Development Environments */}
                  <div className="flex items-center justify-center space-x-6">
                    <div className="group flex flex-col items-center transition-all">
                      <img src="/cursor.jpg" alt="Cursor" className="h-7 w-auto rounded-md opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="group flex flex-col items-center transition-all">
                      <img src="/replit.png" alt="Replit" className="h-7 w-auto rounded-md opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="group flex flex-col items-center transition-all">
                      <img src="/lovable.jpeg" alt="Lovable" className="h-7 w-auto rounded-md opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {/* Trello Integration */}
                  <div className="flex items-center space-x-2 text-[#6b7280] text-xs border-t border-[#e5e7eb] pt-2">
                    <img src="/trello.png" alt="Trello" className="h-4 w-auto rounded opacity-60" />
                    <span>Trello integration coming soon</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-2">
            <Link
              href="/project/new"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium bg-[#0F533A] text-white hover:bg-[#0a3f2c] transition-all duration-200 shadow-sm group"
            >
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create your first project
            </Link>
            </div>
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
                  onClick={(e) => {
                    // Direct navigation to project page without any checks
                    window.location.href = `/project/${project.id}`;
                  }}
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
                        {/* Implementation Guide Button - Only show when project is complete */}
                        {progress === 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/implementation/${project.id}`);
                            }}
                            className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                          >
                            Implementation Guide
                            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
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
                                try {
                                  // Find a PRD associated with any brief in this project
                                  const brief = briefs[0];
                                  if (!brief) {
                                    console.error('No brief found for this project');
                                    window.location.href = `/project/${project.id}`;
                                    return;
                                  }
                                  
                                  // Try to find PRDs for this brief
                                  const prds = await prdService.getPRDsByBriefId(brief.id);
                                  if (!prds || prds.length === 0) {
                                    console.error('No PRDs found for brief:', brief.id);
                                    window.location.href = `/project/${project.id}`;
                                    return;
                                  }
                                  
                                  // Get the most recently created PRD
                                  const latestPrd = prds.sort((a, b) => 
                                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                  )[0];
                                  
                                  console.log(`Found latest PRD with ID ${latestPrd.id} for brief ${brief.id}`);
                                  
                                  // Use direct navigation to ensure it works
                                  window.location.href = `/screens/${latestPrd.id}`;
                                } catch (error) {
                                  console.error('Error navigating to screens:', error);
                                  window.location.href = `/project/${project.id}`;
                                }
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
                        {/* View Tech Docs Button */}
                        {nextStage === 5 && (
                          <button
                            onClick={async () => {
                              let url = `/project/${project.id}`;
                              
                              // Find a PRD associated with any brief in this project
                              const brief = briefs[0];
                              if (brief) {
                                try {
                                  // Try to find a PRD for this brief
                                  const prds = await prdService.getPRDsByBriefId(brief.id);
                                  if (prds && prds.length > 0) {
                                    // Check if tech doc exists in Supabase
                                    const techDoc = await techDocService.getTechDocByPrdId(prds[0].id);
                                    if (techDoc) {
                                      console.log(`Found tech doc for PRD ${prds[0].id}`);
                                      url = `/docs/${prds[0].id}`;
                                    } else {
                                      // Fallback to local storage
                                      const localTechDoc = techDocStore.getTechDocByPrdId(prds[0].id);
                                      if (localTechDoc) {
                                        console.log(`Found local tech doc for PRD ${prds[0].id}`);
                                        url = `/docs/${prds[0].id}`;
                                      } else {
                                        console.error('No tech doc found for PRD:', prds[0].id);
                                        url = `/implementation/${project.id}`;
                                      }
                                    }
                                  } else {
                                    // Fallback to local store if not found in Supabase
                                    const localPrd = prdStore.getPRDByBriefId(brief.id);
                                    if (localPrd) {
                                      // Check if tech doc exists in Supabase
                                      const techDoc = await techDocService.getTechDocByPrdId(localPrd.id);
                                      if (techDoc) {
                                        console.log(`Found tech doc for local PRD ${localPrd.id}`);
                                        url = `/docs/${localPrd.id}`;
                                      } else {
                                        // Fallback to local storage
                                        const localTechDoc = techDocStore.getTechDocByPrdId(localPrd.id);
                                        if (localTechDoc) {
                                          console.log(`Found local tech doc for local PRD ${localPrd.id}`);
                                          url = `/docs/${localPrd.id}`;
                                        } else {
                                          console.error('No tech doc found for local PRD:', localPrd.id);
                                          url = `/implementation/${project.id}`;
                                        }
                                      }
                                    } else {
                                      console.error('No PRD found for brief:', brief.id);
                                      url = `/implementation/${project.id}`;
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error finding tech doc:', error);
                                  url = `/implementation/${project.id}`;
                                }
                              } else {
                                console.error('No brief found for this project');
                                url = `/implementation/${project.id}`;
                              }
                              
                              router.push(url);
                            }}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm bg-white text-[#0F533A] border border-[#0F533A] hover:bg-[#f0f2f5]"
                          >
                            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            View Tech Docs
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
                                          url = `/implementation/${project.id}`;
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error finding PRD:', error);
                                      url = `/implementation/${project.id}`;
                                    }
                                  } else {
                                    console.error('No brief found for this project');
                                    url = `/implementation/${project.id}`;
                                  }
                                } else if (nextStage === 4) {
                                  // Find a PRD associated with any brief in this project
                                  const brief = briefs[0];
                                  if (brief) {
                                    try {
                                      // Try to find a PRD for this brief
                                      const prds = await prdService.getPRDsByBriefId(brief.id);
                                      if (prds && prds.length > 0) {
                                        console.log(`Found PRD with ID ${prds[0].id} for brief ${brief.id}`);
                                        url = `/docs/${prds[0].id}`;
                                      } else {
                                        // Fallback to local store if not found in Supabase
                                        const localPrd = prdStore.getPRDByBriefId(brief.id);
                                        if (localPrd) {
                                          console.log(`Found local PRD with ID ${localPrd.id} for brief ${brief.id}`);
                                          url = `/docs/${localPrd.id}`;
                                        } else {
                                          console.error('No PRD found for any brief in this project');
                                          url = `/implementation/${project.id}`;
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error finding PRD for Tech Docs:', error);
                                      url = `/implementation/${project.id}`;
                                    }
                                  } else {
                                    console.error('No brief found for this project');
                                    url = `/implementation/${project.id}`;
                                  }
                                } else {
                                  url = `/implementation/${project.id}`;
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
                             'Implementation Guide'}
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
      
      {/* Add FeedbackModal */}
      {projectsWithGuides.length > 0 && (
        <FeedbackModal
          isOpen={showModal}
          onClose={closeModal}
          projectId={projectsWithGuides[0]} // Use the first project with a guide
        />
      )}
      
      {/* Alpha version footer - positioned at the bottom */}
      <footer className="w-full py-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div className="flex items-center mb-2 md:mb-0">
              <span>021 is in </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mx-1">
                ALPHA
              </span>
              <span>version</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Built by Panchito studio</span>
              <a 
                href="https://x.com/arielmathov" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#0F533A] hover:text-[#0a3f2c] transition-colors flex items-center"
              >
                <span className="mr-1">Get in touch</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 