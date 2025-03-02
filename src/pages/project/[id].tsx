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
  }
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [prds, setPrds] = useState<PRD[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [featureSets, setFeatureSets] = useState<FeatureSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // Fetch PRDs from Supabase instead of local storage
      const allPRDs: any[] = [];
      
      // Use Promise.all to fetch PRDs for all briefs in parallel
      await Promise.all(briefsData.map(async (brief) => {
        try {
          const briefPRDs = await prdService.getPRDsByBriefId(brief.id);
          if (briefPRDs.length > 0) {
            allPRDs.push(...briefPRDs);
          }
        } catch (error) {
          console.error(`Error loading PRDs for brief ${brief.id}:`, error);
        }
      }));
      
      setPrds(allPRDs);
      
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && id) {
      loadProject();
    }
  }, [id, user, authLoading]);

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
    const hasScreens = briefs.some(brief => {
      // Find the PRD for this brief from the prds array
      const prd = prds.find(p => p.briefId === brief.id);
      return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
    });

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
    const hasTechDocs = briefs.some(brief => {
      // Find the PRD for this brief from the prds array
      const prd = prds.find(p => p.briefId === brief.id);
      return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
    });

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
                className="inline-flex items-center justify-center text-[#6b7280] hover:text-red-600 transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              <h2 className="text-xl font-semibold text-[#111827]">Project Progress: Complete all steps to start development</h2>
              <div className="bg-[#e6f0eb] text-[#0F533A] text-sm px-3 py-1 rounded-full font-medium">
                {!briefs.length ? '0' : 
                 !featureSets.length ? '1' : 
                 !prds.length ? '2' : 
                 !briefs.some(brief => {
                   const prd = prds.find(p => p.briefId === brief.id);
                   return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                 }) ? '3' : 
                 !briefs.some(brief => {
                   const prd = prds.find(p => p.briefId === brief.id);
                   return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                 }) ? '4' : '5'}/5 steps completed
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
                           !briefs.some(brief => {
                             const prd = prds.find(p => p.briefId === brief.id);
                             return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                           }) ? '60%' : 
                           !briefs.some(brief => {
                             const prd = prds.find(p => p.briefId === brief.id);
                             return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                           }) ? '80%' : '100%',
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
                    const hasScreens = briefs.some(brief => {
                      const prd = prds.find(p => p.briefId === brief.id);
                      return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                    });
                    
                    status = hasScreens ? 'completed' : 
                             prds.length > 0 ? 'active' : 'upcoming';
                  } else if (index === 4) {
                    const hasScreens = briefs.some(brief => {
                      const prd = prds.find(p => p.briefId === brief.id);
                      return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                    });
                    
                    const hasTechDocs = briefs.some(brief => {
                      const prd = prds.find(p => p.briefId === brief.id);
                      return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                    });
                    
                    status = hasTechDocs ? 'completed' : 
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
                     prds.length > 0 && !briefs.some(brief => {
                       const prd = prds.find(p => p.briefId === brief.id);
                       return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                     }) ? 'Generate app screens based on your PRD' :
                     briefs.some(brief => {
                       const prd = prds.find(p => p.briefId === brief.id);
                       return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                     }) && !briefs.some(brief => {
                       const prd = prds.find(p => p.briefId === brief.id);
                       return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                     }) ? 'Create technical documentation for your project' :
                     '🎉 Congratulations! All stages are completed. Download your project documentation.'}
                  </p>
                </div>
                {briefs.some(brief => {
                  const prd = prds.find(p => p.briefId === brief.id);
                  return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                }) ? (
                  <button
                    onClick={downloadProjectDocs}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                  >
                    Download Documentation
                    <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15L12 3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={!briefs.length ? `/brief/new?projectId=${project.id}` : 
                          featureSets.length > 0 && prds.length === 0 ? `/prd/new?projectId=${project.id}` :
                          briefs.length > 0 && featureSets.length === 0 ? `/brief/${briefs[0].id}/ideate` :
                          prds.length > 0 && !briefs.some(brief => {
                            const prd = prds.find(p => p.briefId === brief.id);
                            return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                          }) ? `/screens/${(() => {
                            const brief = briefs.find((b: Brief) => prds.find(p => p.briefId === b.id));
                            if (brief) {
                              const prdList = prds.filter(p => p.briefId === brief.id);
                              if (prdList.length > 0) {
                                return prdList[0].id;
                              }
                            }
                            return '';
                          })()}` :
                          `/docs/${(() => {
                            const brief = briefs.find((brief: Brief) => prds.find(p => p.briefId === brief.id));
                            return brief ? prds.find(p => p.briefId === brief.id)?.id : '';
                          })()}`}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                  >
                    {!briefs.length ? 'Create Brief' : 
                     featureSets.length > 0 && prds.length === 0 ? 'Generate PRD' :
                     briefs.length > 0 && featureSets.length === 0 ? 'Generate Features' :
                     prds.length > 0 && !briefs.some(brief => {
                       const prd = prds.find(p => p.briefId === brief.id);
                       return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                     }) ? 'Generate Screens' :
                     'Create Tech Docs'}
                    <svg className="w-3.5 h-3.5 ml-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
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
                          <path d="M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  briefs.some(brief => {
                    const prd = prds.find(p => p.briefId === brief.id);
                    return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                  }) ? 'bg-[#10b981]' : 
                  prds.length > 0 ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Screens</h2>
              </div>
              <div className={`${
                !prds.length ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                briefs.some(brief => {
                  const prd = prds.find(p => p.briefId === brief.id);
                  return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                }) ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!prds.length ? 'Locked' : 
                 briefs.some(brief => {
                   const prd = prds.find(p => p.briefId === brief.id);
                   return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                 }) ? 'Completed' : 'Active'}
              </div>
            </div>
            
            {!prds.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-[#111827] mb-2">Complete PRD First</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate a PRD to unlock Screen Design</p>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                {!briefs.some(brief => {
                  const prd = prds.find(p => p.briefId === brief.id);
                  return prd && require('../../utils/screenStore').screenStore.getScreenSetByPrdId(prd.id);
                }) ? (
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-[#111827] mb-2">No Screens yet</h3>
                    <p className="text-[#6b7280] mb-6 max-w-md mx-auto">
                      Generate app screens based on your PRD to visualize your product
                    </p>
                    <Link
                      href={`/screens/${(() => {
                        const brief = briefs.find((b: Brief) => prds.find(p => p.briefId === b.id));
                        if (brief) {
                          const prdList = prds.filter(p => p.briefId === brief.id);
                          if (prdList.length > 0) {
                            return prdList[0].id;
                          }
                        }
                        return '';
                      })()}`}
                      className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                    >
                      Generate Screens
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#111827] mb-2">
                          Screens Created
                        </h3>
                        <p className="text-[#6b7280]">
                          Your app screens have been generated and are ready to view
                        </p>
                      </div>
                      <Link
                        href={`/screens/${(() => {
                          const brief = briefs.find((b: Brief) => prds.find(p => p.briefId === b.id));
                          if (brief) {
                            const prdList = prds.filter(p => p.briefId === brief.id);
                            if (prdList.length > 0) {
                              return prdList[0].id;
                            }
                          }
                          return '';
                        })()}`}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                      >
                        View Screens
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Documentation Section */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  briefs.some(brief => {
                    const prd = prds.find(p => p.briefId === brief.id);
                    return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                  }) ? 'bg-[#10b981]' : 
                  prds.length > 0 ? 'bg-[#0F533A]' : 'bg-[#9ca3af]'
                } mr-2`}></div>
                <h2 className="text-xl font-semibold text-[#111827]">Technical Documentation</h2>
              </div>
              <div className={`${
                !prds.length ? 'bg-[#f0f2f5] text-[#6b7280]' : 
                briefs.some(brief => {
                  const prd = prds.find(p => p.briefId === brief.id);
                  return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                }) ? 'bg-[#e6f0eb] text-[#0F533A]' : 
                'bg-[#e6f0eb] text-[#0F533A]'
              } px-3 py-1 rounded-full text-xs font-medium`}>
                {!prds.length ? 'Locked' : 
                 briefs.some(brief => {
                   const prd = prds.find(p => p.briefId === brief.id);
                   return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                 }) ? 'Completed' : 'Active'}
              </div>
            </div>
            
            {!prds.length ? (
              <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-[#111827] mb-2">Complete PRD First</h3>
                <p className="text-[#6b7280] mb-6 max-w-md mx-auto">Generate a PRD to unlock Technical Documentation</p>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] rounded-lg p-8">
                {!briefs.some(brief => {
                  const prd = prds.find(p => p.briefId === brief.id);
                  return prd && require('../../utils/techDocStore').techDocStore.getTechDocByPrdId(prd.id);
                }) ? (
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-[#111827] mb-2">No Technical Documentation yet</h3>
                    <p className="text-[#6b7280] mb-6 max-w-md mx-auto">
                      Generate technical documentation based on your PRD to guide your development team
                    </p>
                    <Link
                      href={`/docs/${(() => {
                        const brief = briefs.find((brief: Brief) => prds.find(p => p.briefId === brief.id));
                        return brief ? prds.find(p => p.briefId === brief.id)?.id : '';
                      })()}`}
                      className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                    >
                      Create Tech Documents
                      <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827] mb-2">
                        Technical Documentation Created
                      </h3>
                      <p className="text-[#6b7280]">
                        Your technical documentation has been created and is ready for your development team
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Link
                        href={`/docs/${(() => {
                          const brief = briefs.find((brief: Brief) => prds.find(p => p.briefId === brief.id));
                          return brief ? prds.find(p => p.briefId === brief.id)?.id : '';
                        })()}`}
                        className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                      >
                        View Documentation
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                      <button
                        onClick={downloadProjectDocs}
                        className="inline-flex items-center justify-center bg-white text-[#0F533A] border border-[#0F533A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                      >
                        Download Documentation
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15L12 3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project Timeline */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            {/* ... existing code ... */}
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
    </div>
  );
} 