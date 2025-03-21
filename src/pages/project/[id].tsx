import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import EmptyState from '../../components/EmptyState';
import PRDList from '../../components/PRDList';
import BriefList from '../../components/BriefList';
import { Project, projectService } from '../../services/projectService';
import { PRD, prdService } from '../../services/prdService';
import { Brief, briefService } from '../../services/briefService';
import { FeatureSet, featureStore } from '../../utils/featureStore';
import { useAuth } from '../../context/AuthContext';
import { featureService } from '../../services/featureService';
import { techDocService } from '../../services/techDocService';
import { useFeedbackModal } from '../../hooks/useFeedbackModal';
import FeedbackModal from '../../components/FeedbackModal';
import { implementationGuideService } from '../../services/implementationGuideService';
import screenService from '../../services/screenService';
import { trackEvent } from '../../lib/mixpanelClient';

// Define stages and their display info
const PROJECT_STAGES = [
  { id: 'brief', name: 'Brief' },
  { id: 'ideation', name: 'Ideation' },
  { id: 'prd', name: 'PRD' },
  { id: 'screens', name: 'Screens' },
  { id: 'docs', name: 'Tech Docs' }
];

// Color scheme for the application
const COLORS = {
  project: {
    primary: '#0F533A',
    secondary: '#10b981',
    light: '#e6f0eb',
    border: '#0F533A'
  },
  task: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    light: '#eff6ff',
    border: '#3b82f6'
  },
  docs: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    light: '#f5f3ff',
    border: '#8b5cf6'
  },
  status: {
    completed: '#3b82f6',
    active: '#3b82f6',
    upcoming: '#9ca3af'
  },
  neutral: {
    lighter: '#f0f2f5',
    light: '#e5e7eb',
    medium: '#6b7280',
    dark: '#4b5563'
  },
  implementation: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    light: '#f5f3ff',
    border: 'rgba(139, 92, 246, 0.2)',
  },
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [prds, setPrds] = useState<PRD[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [featureSets, setFeatureSets] = useState<FeatureSet[]>([]);
  const [techDocs, setTechDocs] = useState<{[prdId: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasImplementationGuide, setHasImplementationGuide] = useState(false);
  const [hasScreens, setHasScreens] = useState(false);

  // Calculate if screens exist for any PRD
  useEffect(() => {
    const checkForScreens = async () => {
      console.log('Checking for screens in useEffect');
      if (!prds || prds.length === 0) {
        console.log('No PRDs found, setting hasScreens to false');
        setHasScreens(false);
        return;
      }

      try {
        // Check each PRD for screens using screenService
        for (const prd of prds) {
          console.log(`Checking screens for PRD ${prd.id} using screenService`);
          const screenSet = await screenService.getScreenSetByPrdId(prd.id);
          console.log(`Screen set from screenService for PRD ${prd.id}:`, screenSet);
          
          if (screenSet && screenSet.screens && screenSet.screens.length > 0) {
            console.log(`Found ${screenSet.screens.length} screens for PRD ${prd.id}`);
            setHasScreens(true);
            return;
          }
        }
        
        console.log('No screens found for any PRD, setting hasScreens to false');
        setHasScreens(false);
      } catch (error) {
        console.error('Error checking for screens:', error);
        setHasScreens(false);
      }
    };

    checkForScreens();
  }, [prds]);

  console.log('Final hasScreens value:', hasScreens);

  const nextStepButtonText = !briefs.length ? 'Create Brief' : 
    featureSets.length > 0 && prds.length === 0 ? 'Generate PRD' :
    briefs.length > 0 && featureSets.length === 0 ? 'Generate Features' :
    prds.length > 0 && !hasScreens ? 'Generate Screens' :
    'Create Tech Docs';
    
  console.log('Final nextStepButtonText:', nextStepButtonText);

  const handleGenerateNextStep = () => {
    if (!project) return;
    console.log('handleGenerateNextStep called, hasScreens:', hasScreens);
    
    if (!briefs.length) {
      router.push(`/brief/new?projectId=${project.id}`);
    } else if (featureSets.length > 0 && prds.length === 0) {
      router.push(`/prd/new?projectId=${project.id}`);
    } else if (briefs.length > 0 && featureSets.length === 0) {
      // Navigate to the first brief to generate features
      router.push(`/features/${briefs[0].id}`);
    } else if (prds.length > 0 && !hasScreens) {
      // If no screens exist, navigate to create screens
      const brief = briefs.find((b: Brief) => prds.find(p => p.briefId === b.id));
      if (brief) {
        const prdList = prds.filter(p => p.briefId === brief.id);
        if (prdList.length > 0) {
          router.push(`/screens/${prdList[0].id}`);
        }
      }
    } else {
      // If screens exist but tech docs don't, navigate to create tech docs
      if (prds.length > 0) {
        router.push(`/docs/${prds[0].id}`);
      } else {
        router.push(`/brief/${briefs[0].id}/ideate`);
      }
    }
  };

  const loadProject = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch project
      const projectData = await projectService.getProjectById(id as string);
      setProject(projectData);
      
      // Fetch briefs
      const briefsData = await briefService.getBriefsByProjectId(id as string);
      setBriefs(briefsData);
      
      // Fetch feature sets from Supabase instead of local storage
      const allFeatureSets: any[] = [];
      
      // Use Promise.all to fetch feature sets for all briefs in parallel
      await Promise.all(briefsData.map(async (brief) => {
        try {
          const briefFeatureSet = await featureService.getFeatureSetByBriefId(brief.id);
          if (briefFeatureSet) {
            allFeatureSets.push(briefFeatureSet);
          }
        } catch (error) {
          console.error(`Error loading feature set for brief ${brief.id}:`, error);
        }
      }));
      
      setFeatureSets(allFeatureSets);
      
      // Fetch PRDs for all briefs
      let allPrds: PRD[] = [];
      await Promise.all(briefsData.map(async (brief) => {
        try {
          const briefPrds = await prdService.getPRDsByBriefId(brief.id);
          allPrds = [...allPrds, ...briefPrds];
        } catch (error) {
          console.error(`Error loading PRDs for brief ${brief.id}:`, error);
        }
      }));
      setPrds(allPrds);
      
      // Fetch tech docs for all PRDs
      const techDocsStatus: {[prdId: string]: boolean} = {};
      await Promise.all(allPrds.map(async (prd) => {
        try {
          const techDoc = await techDocService.getTechDocByPrdId(prd.id);
          techDocsStatus[prd.id] = !!techDoc;
        } catch (error) {
          console.error(`Error loading tech doc for PRD ${prd.id}:`, error);
          techDocsStatus[prd.id] = false;
        }
      }));
      setTechDocs(techDocsStatus);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && id) {
      loadProject();
    }
  }, [id, user, authLoading]);

  // Add effect to handle back navigation
  useEffect(() => {
    // Check if we came from implementation page
    if (document.referrer.includes('/implementation/')) {
      router.replace('/projects');
    }
  }, [router]);

  const handleDeleteProject = async () => {
    if (project) {
      try {
        const deleted = await projectService.deleteProject(project.id);
        if (deleted) {
          router.push('/projects');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleDeletePRD = async (prdId: string) => {
    try {
      await prdService.deletePRD(prdId);
      setPrds(currentPrds => currentPrds.filter(p => p.id !== prdId));
    } catch (error) {
      console.error('Error deleting PRD:', error);
    }
  };

  const handleDeleteBrief = async (briefId: string) => {
    try {
      await briefService.deleteBrief(briefId);
      // Update the UI by filtering out the deleted brief
      setBriefs(currentBriefs => currentBriefs.filter(b => b.id !== briefId));
    } catch (error) {
      console.error('Error deleting brief:', error);
    }
  };

  // Helper function to get stage color based on stage ID and status
  const getStageColor = (stageId: string, status: string) => {
    // Use green color scheme for all stages
    if (status === 'completed') return { bg: COLORS.project.light, text: COLORS.project.primary, border: COLORS.project.primary };
    if (status === 'active') return { bg: COLORS.project.light, text: COLORS.project.primary, border: COLORS.project.primary };
    return { bg: COLORS.neutral.lighter, text: COLORS.neutral.medium, border: 'transparent' };
  };

  // Function to generate markdown content
  const exportProjectMarkdown = () => {
    if (!project || !briefs.length) return '';
    
    let markdown = `# ${project.name}\n\n`;
    
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }
    
    // Add Brief section
    if (briefs.length) {
      markdown += `## Brief\n\n`;
      const brief = briefs[0];
      
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
    }
    
    // Add Features section
    if (featureSets.length) {
      markdown += `## Features\n\n`;
      
      const featureSet = featureSets[0];
      
      // Group features by priority
      const mustFeatures = featureSet.features.filter(f => f.priority === 'must');
      const shouldFeatures = featureSet.features.filter(f => f.priority === 'should');
      const couldFeatures = featureSet.features.filter(f => f.priority === 'could');
      const wontFeatures = featureSet.features.filter(f => f.priority === 'wont');
      
      if (mustFeatures.length) {
        markdown += `### Must Have\n`;
        mustFeatures.forEach(feature => {
          markdown += `- **${feature.name}**: ${feature.description}\n`;
        });
        markdown += '\n';
      }
      
      if (shouldFeatures.length) {
        markdown += `### Should Have\n`;
        shouldFeatures.forEach(feature => {
          markdown += `- **${feature.name}**: ${feature.description}\n`;
        });
        markdown += '\n';
      }
      
      if (couldFeatures.length) {
        markdown += `### Could Have\n`;
        couldFeatures.forEach(feature => {
          markdown += `- **${feature.name}**: ${feature.description}\n`;
        });
        markdown += '\n';
      }
      
      if (wontFeatures.length) {
        markdown += `### Won't Have\n`;
        wontFeatures.forEach(feature => {
          markdown += `- **${feature.name}**: ${feature.description}\n`;
        });
        markdown += '\n';
      }
    }
    
    // Add PRD section
    if (prds.length) {
      markdown += `## Product Requirements\n\n`;
      
      const prd = prds[0];
      
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
    }
    
    // Add Screens section if available
    let hasScreens = false;
    
    try {
      // Import screenStore directly
      const screenStoreModule = require('../../utils/screenStore');
      const screenStore = screenStoreModule.screenStore;
      
      // Check each PRD for screens
      for (const brief of briefs) {
      const prd = prds.find(p => p.briefId === brief.id);
        if (prd) {
          // First try to get the screen set
          const screenSet = screenStore.getScreenSetByPrdId(prd.id);
          // Check if there are any screens for this PRD
          const screensForPrd = screenStore.screens.filter(screen => screen.prdId === prd.id);
          if (screensForPrd && screensForPrd.length > 0) {
            hasScreens = true;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking for screens:', error);
    }

    if (hasScreens) {
      markdown += `## Screens\n\n`;
      const brief = briefs[0];
      // Find the PRD for this brief from the prds array
      const prd = prds.find(p => p.briefId === brief.id);
      if (prd) {
        const screenSet = require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
        if (screenSet) {
          // Add screen journey/flow if available
          if (screenSet.journey) {
            markdown += `### User Journey\n${screenSet.journey}\n\n`;
          }
          if (screenSet.userFlows) {
            markdown += `### User Flows\n${screenSet.userFlows}\n\n`;
          }
          
          // Add individual screens
          markdown += `### Screens\n\n`;
          screenSet.screens.forEach(screen => {
            markdown += `#### ${screen.name}\n`;
            markdown += `${screen.description || ''}\n\n`;
            if (screen.interactions) {
              markdown += `**Interactions:**\n${screen.interactions}\n\n`;
            }
            if (screen.flow) {
              markdown += `**Flow:**\n${screen.flow}\n\n`;
            }
          });
        }
      }
    }

    // Add Technical Documentation section if available
    const hasTechDocs = prds.some(prd => techDocs[prd.id]);

    if (hasTechDocs) {
      markdown += `## Technical Documentation\n\n`;
      const brief = briefs[0];
      // Find the PRD for this brief from the prds array
      const prd = prds.find(p => p.briefId === brief.id);
      if (prd) {
        const techDoc = require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
        if (techDoc) {
          if (techDoc.platform) {
            markdown += `### Platform\n${techDoc.platform}\n\n`;
          }
          if (techDoc.architecture) {
            markdown += `### Architecture\n${techDoc.architecture}\n\n`;
          }
          if (techDoc.dataModel) {
            markdown += `### Data Model\n${techDoc.dataModel}\n\n`;
          }
          if (techDoc.api) {
            markdown += `### API\n${techDoc.api}\n\n`;
          }
          if (techDoc.security) {
            markdown += `### Security\n${techDoc.security}\n\n`;
          }
          if (techDoc.deployment) {
            markdown += `### Deployment\n${techDoc.deployment}\n\n`;
          }
        }
      }
    }
    
    return markdown;
  };

  // Function to download markdown file
  const downloadProjectDocs = () => {
    const markdown = exportProjectMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name.toLowerCase().replace(/\s+/g, '-')}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Function to handle PRD navigation
  const handlePRDNavigation = async (briefId: string) => {
    try {
      // Check if PRDs exist for this brief
      const existingPRDs = await prdService.getPRDsByBriefId(briefId);
      
      if (existingPRDs.length > 0) {
        // If PRDs exist, redirect to the first PRD
        router.push(`/prd/${existingPRDs[0].id}`);
      } else {
        // If no PRDs exist, redirect to the new PRD page with the project ID
        router.push(`/prd/new?projectId=${project?.id}`);
      }
    } catch (error) {
      console.error('Error navigating to PRD:', error);
      // Default to the new PRD page if there's an error
      router.push(`/prd/new?projectId=${project?.id}`);
    }
  };

  useEffect(() => {
    const checkImplementationGuide = async () => {
      if (!id || typeof id !== 'string') return;
      const guide = await implementationGuideService.getGuideByProjectId(id);
      setHasImplementationGuide(!!guide);
    };
    
    checkImplementationGuide();
  }, [id]);

  const { showModal, closeModal } = useFeedbackModal(hasImplementationGuide);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A]"></div>
              <p className="mt-4 text-[#6b7280]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A]"></div>
              <p className="mt-4 text-[#6b7280]">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="Project not found"
            description="The project you're looking for doesn't exist or has been deleted."
            icon="project"
            action={{
              href: "/projects",
              text: "Back to Projects"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center text-sm text-[#6b7280] mb-4 space-x-2">
            <Link href="/projects" className="hover:text-[#111827] transition-colors flex items-center">
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Projects
            </Link>
            <span>/</span>
            <span className="text-[#111827]">{project.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">{project.name}</h1>
              {project.description && (
                <p className="text-[#4b5563] mt-2 max-w-2xl">{project.description}</p>
              )}
              <div className="text-xs text-[#6b7280] mt-3 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center space-x-3 self-start">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5H13.66M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {/* Project Progress Summary */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-[#111827] tracking-tight flex items-center">
                <span className="mr-2">Project Progress:</span>
                <span className="text-[#4b5563] font-medium text-lg">Complete all steps to start development</span>
              </h2>
              <div className="bg-[#e6f0eb] text-[#0F533A] text-sm px-3 py-1 rounded-full font-medium">
                {!briefs.length ? '0' : 
                 !featureSets.length ? '1' : 
                 !prds.length ? '2' : 
                 !hasScreens ? '3' : 
                 !prds.some(prd => techDocs[prd.id]) ? '4' : '5'}/5 steps completed
              </div>
            </div>
            
            <div className="relative mt-8">
              {/* Progress bar */}
              <div className="h-2 bg-[#e5e7eb] rounded-full mb-5">
                <div 
                  className="h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ 
                    width: !briefs.length ? '0%' : 
                           !featureSets.length ? '20%' :
                           !prds.length ? '40%' :
                           !hasScreens ? '60%' : 
                           !prds.some(prd => techDocs[prd.id]) ? '80%' : '100%',
                    backgroundColor: COLORS.project.primary
                  }}
                ></div>
              </div>
              
              {/* Project Timeline */}
              <div className="grid grid-cols-5 gap-2 relative">
                {PROJECT_STAGES.map((stage, index) => {
                  // Determine status based on briefs, feature sets, and PRDs
                  let status;
                  if (index === 0) {
                    status = briefs.length ? 'completed' : 'active';
                  } else if (index === 1) {
                    status = featureSets.length > 0 ? 'completed' : 
                             briefs.length ? 'active' : 'upcoming';
                  } else if (index === 2) {
                    status = prds.length > 0 ? 'completed' : 
                             featureSets.length > 0 ? 'active' : 'upcoming';
                  } else if (index === 3) {
                    status = hasScreens ? 'completed' : 
                             prds.length > 0 ? 'active' : 'upcoming';
                  } else if (index === 4) {
                    status = prds.some(prd => techDocs[prd.id]) ? 'completed' : 
                             hasScreens ? 'active' : 'upcoming';
                  }
                  
                  const colors = getStageColor(stage.id.toLowerCase(), status);
                  
                  return (
                    <div key={stage.id} className="flex flex-col items-center relative">
                      <div 
                        className="w-full py-2 px-1 rounded-md text-center text-xs font-medium flex items-center justify-center transition-all duration-200"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderBottom: `2px solid ${colors.border}`,
                          boxShadow: status === 'active' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                          transform: status === 'active' ? 'translateY(-1px)' : 'none'
                        }}
                      >
                        {stage.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Next Action Section */}
              <div className="mt-6 pt-6 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="sm:max-w-[60%]">
                  <h4 className="text-sm font-medium text-[#4b5563]">Next Step</h4>
                  <p className="text-xs text-[#6b7280] mt-1">
                    {!briefs.length ? 'Create a Brief to get started' : 
                     featureSets.length > 0 && prds.length === 0 ? 'Generate a PRD based on your features' :
                     briefs.length > 0 && featureSets.length === 0 ? 'Generate features for your product' :
                     prds.length > 0 && !hasScreens ? 'Generate app screens based on your PRD' :
                     hasScreens && Object.values(techDocs).every(val => !val) ? 'Create technical documentation for your project' :
                     '🎉 Congratulations! All stages are completed. Generate an implementation guide for AI coding assistants.'}
                  </p>
                </div>
                {prds.some(prd => techDocs[prd.id]) ? (
                  <div className="flex space-x-3">
                    <Link
                      href={`/implementation/${project.id}`}
                    className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7c3aed] transition-colors"
                  >
                      Implementation Guide
                    <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateNextStep}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                  >
                    {nextStepButtonText}
                    <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Briefs section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  briefs.length > 0 ? 'bg-[#10b981]' : 'bg-[#0F533A]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Product Brief</h2>
              </div>
              <div className={`${
                briefs.length > 0 ? 'bg-[#e6f0eb] text-[#0F533A]' : 'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {briefs.length > 0 ? 'Completed' : 'Active'}
              </div>
            </div>
            
            <div className="mt-4">
              {briefs.length === 0 ? (
                <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[#111827] mb-2">No brief yet</h3>
                  <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Create a brief to get started with your product</p>
                  
                  <Link
                    href={`/brief/new?projectId=${project.id}`}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create Brief
                  </Link>
                </div>
              ) : (
                <div className="bg-[#f8f9fa] rounded-lg p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827] mb-2">
                        Brief Created
                      </h3>
                      <p className="text-[#6b7280]">
                        Your product brief is ready for feature ideation
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteBrief(briefs[0].id)}
                        className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-[#f0f2f5]"
                        aria-label="Delete brief"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <Link
                        href={`/brief/${briefs[0].id}`}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                      >
                        View Brief
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ideation section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  featureSets.length > 0 ? 'bg-[#10b981]' : 
                  briefs.length ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Feature Ideation</h2>
              </div>
              <div className={`${
                !briefs.length ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                featureSets.length > 0 ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!briefs.length ? 'Locked' : featureSets.length > 0 ? 'Completed' : 'Active'}
              </div>
            </div>
            
            {!briefs.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-[#111827] mb-2">Start with a Brief</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Create a Brief to unlock Feature Ideation</p>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-[#111827] mb-2">
                      {featureSets.length > 0 ? 'Features Generated' : 'Feature Ideation'}
                    </h3>
                    <p className="text-[#6b7280]">
                      {featureSets.length > 0 
                        ? 'Features have been generated and are ready for PRD creation'
                        : 'Generate or define features for your product'}
                    </p>
                  </div>
                  <Link
                    href={`/brief/${briefs[0].id}/ideate`}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                  >
                    {featureSets.length > 0 ? 'View Features' : 'Start Ideation'}
                    <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* PRD Section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  prds.length > 0 ? 'bg-[#10b981]' : 
                  featureSets.length > 0 ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Product Requirement Documents</h2>
              </div>
              <div className={`${
                !featureSets.length ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                prds.length > 0 ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!featureSets.length ? 'Locked' : prds.length > 0 ? 'Completed' : 'Active'}
              </div>
            </div>
            
            {!featureSets.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-[#111827] mb-2">Complete Feature Ideation First</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate features to unlock PRD creation</p>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                {prds.length === 0 ? (
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-[#111827] mb-2">No PRDs yet</h3>
                    <p className="text-[#6b7280] mb-6 max-w-md mx-auto">
                      Generate your first PRD to document your product requirements
                    </p>
                    <Link
                      href={`/prd/new?projectId=${project.id}`}
                      className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                    >
                      Generate PRD
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#111827] mb-2">
                          PRDs Created
                        </h3>
                        <p className="text-[#6b7280]">
                          Your PRDs have been created and are ready for screen generation
                        </p>
                      </div>
                      {/* PRD Button */}
                      <div>
                        <button
                          onClick={() => handlePRDNavigation(prds[0].briefId)}
                          className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                        >
                          View PRD
                          <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Display PRD list with delete functionality */}
                    <div className="mt-6 border-t border-[#e5e7eb] pt-6">
                      <h4 className="text-sm font-medium text-[#6b7280] mb-4">All PRDs</h4>
                      <PRDList 
                        prds={prds} 
                        onDelete={handleDeletePRD} 
                        projectId={project.id} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Screens Section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  hasScreens ? 'bg-[#10b981]' : 
                  prds.length > 0 ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Screens</h2>
              </div>
              <div className={`${
                !prds.length ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                hasScreens ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!prds.length ? 'Locked' : hasScreens ? 'Completed' : 'Active'}
              </div>
            </div>
            
            {!prds.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-[#111827] mb-2">Complete PRD First</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate a PRD to unlock Screen creation</p>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#111827] mb-2">
                      {hasScreens ? 'Screens Generated' : 'App Screens'}
                        </h3>
                        <p className="text-[#6b7280]">
                      {hasScreens 
                        ? 'App screens have been generated based on your PRD'
                        : 'Generate app screens based on your PRD to visualize your product'}
                        </p>
                      </div>
                  <div className="flex items-center gap-2">
                      <Link
                      href={prds.length > 0 ? `/screens/${prds[0].id}` : '#'}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                      >
                      {hasScreens ? 'View Screens' : 'Generate Screens'}
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* Technical Documentation Section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  prds.some(prd => techDocs[prd.id]) ? 'bg-[#10b981]' : 
                  hasScreens ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Technical Documentation</h2>
              </div>
              <div className={`${
                !hasScreens ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                prds.some(prd => techDocs[prd.id]) ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!hasScreens ? 'Locked' : prds.some(prd => techDocs[prd.id]) ? 'Completed' : 'Active'}
              </div>
            </div>
            
            <div className="mt-4">
            {!prds.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[#111827] mb-2">Technical Documentation</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate a PRD to unlock Technical Documentation</p>
              </div>
              ) : !hasScreens ? (
                <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[#111827] mb-2">Technical Documentation</h3>
                  <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate screens to unlock Technical Documentation</p>
                </div>
              ) : !prds.some(prd => techDocs[prd.id]) ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827] mb-2">Technical Documentation</h3>
                      <p className="text-[#6b7280]">
                        Create technical documentation to guide your development team
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <Link
                        href={`/docs/${prds[0].id}`}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                      >
                        Create Tech Docs
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    </div>
                  </div>
                  </div>
                ) : (
                <div className="bg-[#f8f9fa] rounded-lg p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827] mb-2">
                        Technical Documentation Created
                      </h3>
                      <p className="text-[#6b7280]">
                        Your technical documentation has been generated and is ready to view
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/docs/${prds[0].id}`}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                      >
                        View Tech Docs
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Implementation Guide Section - Always visible with blocked/enabled states */}
          <div className={`${
            prds.some(prd => techDocs[prd.id]) 
              ? "bg-gradient-to-r from-[#8b5cf6]/10 to-[#a78bfa]/10 border-[#8b5cf6]/20 shadow-md" 
              : "bg-gradient-to-r from-[#6366f1]/5 to-[#a855f7]/5 border-[#6366f1]/10 shadow-sm"
          } rounded-2xl border p-6 sm:p-8 mb-8 relative overflow-hidden transition-all duration-300`}>
            {/* Decorative elements visible in both states but different styling */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 transition-all duration-300 ${
              prds.some(prd => techDocs[prd.id]) 
                ? "bg-[#8b5cf6]/5" 
                : "bg-[#6366f1]/5"
            }`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-12 -mb-12 transition-all duration-300 ${
              prds.some(prd => techDocs[prd.id]) 
                ? "bg-[#a78bfa]/5" 
                : "bg-[#a855f7]/5"
            }`}></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 transition-colors duration-300 ${
                  prds.some(prd => techDocs[prd.id])
                    ? "bg-[#0F533A] text-white" 
                    : "bg-[#6366f1]/20 text-[#6366f1]"
                }`}>
                  {prds.some(prd => techDocs[prd.id]) ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 11.1V6.9C22 3.4 20.6 2 17.1 2H12.9C9.4 2 8 3.4 8 6.9V8H11.1C14.6 8 16 9.4 16 12.9V16H17.1C20.6 16 22 14.6 22 11.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                      <path d="M16 17.1V12.9C16 9.4 14.6 8 11.1 8H6.9C3.4 8 2 9.4 2 12.9V17.1C2 20.6 3.4 22 6.9 22H11.1C14.6 22 16 20.6 16 17.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                      <path d="M6.08 15L8.03 16.95L12.02 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21H7C3 21 2 20 2 16V8C2 4 3 3 7 3H17C21 3 22 4 22 8V16C22 20 21 21 17 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 8H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 16H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 11.5C9.88071 11.5 11 10.3807 11 9C11 7.61929 9.88071 6.5 8.5 6.5C7.11929 6.5 6 7.61929 6 9C6 10.3807 7.11929 11.5 8.5 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11 16.5C11 14.8 9.5 13.5 7.5 13.5C5.5 13.5 4 14.8 4 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                    prds.some(prd => techDocs[prd.id]) ? "text-[#0F533A]" : "text-[#6366f1]"
                  }`}>Implementation</h2>
                  {!prds.some(prd => techDocs[prd.id]) && (
                    <span className="text-xs text-[#6366f1]/70">Complete all steps to unlock</span>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                prds.some(prd => techDocs[prd.id])
                  ? "bg-[#0F533A] text-white" 
                  : "bg-[#6366f1]/20 text-[#6366f1]"
              }`}>
                {prds.some(prd => techDocs[prd.id]) ? "Ready" : "Locked"}
              </div>
            </div>
            
            <div className="mt-4 relative z-10">
              {prds.some(prd => techDocs[prd.id]) ? (
                // Enabled state
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827] mb-2">
                        🎉 Congratulations!
                      </h3>
                      <p className="text-[#6b7280]">
                        Your project is ready for implementation. Generate AI-ready guides to help you build your product with AI coding assistants.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/implementation/${project.id}`}
                        className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7c3aed] transition-colors shadow-sm"
                      >
                        View Implementation Guide
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
              </div>
              ) : (
                // Blocked state - more colorful and enticing
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-[#6366f1]/10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#6366f1] mb-2 flex items-center">
                        <span className="mr-2">🏆</span>
                        Final Reward
                      </h3>
                      <p className="text-[#6b7280]">
                        You will unlock AI-ready implementation guides for your project.
                      </p>
                      
                      <div className="mt-4 bg-[#6366f1]/5 rounded-lg p-3 border border-[#6366f1]/10">
                        <h4 className="text-sm font-medium text-[#6366f1] mb-1">What you'll get:</h4>
                        <ul className="text-sm text-[#6b7280] space-y-1">
                          <li className="flex items-start">
                            <svg className="w-4 h-4 text-[#6366f1] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            AI-ready implementation instructions
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 text-[#6366f1] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Step-by-step development guide
                            <span className="flex items-center ml-2 space-x-1.5">
                              <img src="/cursor.jpg" alt="Cursor" className="h-5 w-auto rounded opacity-90" />
                              <img src="/lovable.jpeg" alt="Lovable" className="h-5 w-auto rounded opacity-90" />
                              <img src="/replit.png" alt="Replit" className="h-5 w-auto rounded opacity-90" />
                            </span>
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 text-[#6366f1] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="flex items-center">
                              Export tasks and user stories 
                              <img src="/trello.png" alt="Trello" className="h-5 w-auto rounded opacity-90 mx-1.5" />
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1]/20 text-[#6366f1] cursor-not-allowed">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Complete All Steps First
          </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Track the delete project event
                  trackEvent('Project Deleted', {
                    'project_id': project.id,
                    'project_name': project.name
                  });
                  
                  handleDeleteProject();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add FeedbackModal */}
      {hasImplementationGuide && (
        <FeedbackModal
          isOpen={showModal}
          onClose={closeModal}
          projectId={id as string}
        />
      )}
    </div>
  );
} 