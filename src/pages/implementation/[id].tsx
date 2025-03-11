import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { Project } from '../../utils/projectStore';
import { PRD } from '../../utils/prdStore';
import { projectService } from '../../services/projectService';
import { Brief, briefService } from '../../services/briefService';
import { prdService } from '../../services/prdService';
import { techDocService, TechDoc } from '../../services/techDocService';
import { generateImplementationGuides, ImplementationGuides } from '../../utils/implementationGenerator';
import { implementationGuideService } from '../../services/implementationGuideService';
import FeedbackModal from '../../components/FeedbackModal';
import { TrelloIntegration } from '../../components/integrations';
import TrelloBoardModal from '../../components/TrelloBoardModal';
import TrelloExportStatus from '../../components/TrelloExportStatus';
import { trelloService } from '../../services/trelloService';
import screenService from '../../services/screenService';
import { ScreenSet } from '../../utils/screenStore';

export default function ImplementationGuidePage() {
  const router = useRouter();
  const { id: projectId } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [prd, setPrd] = useState<PRD | null>(null);
  const [techDoc, setTechDoc] = useState<TechDoc | null>(null);
  const [implementationGuide, setImplementationGuide] = useState('');
  const [implementationSteps, setImplementationSteps] = useState('');
  const [generating, setGenerating] = useState(false);
  const [guideGenerated, setGuideGenerated] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [trelloStatus, setTrelloStatus] = useState<{ connected: boolean; token: string | null }>({
    connected: false,
    token: null
  });
  
  // New state for Trello export
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showExportStatus, setShowExportStatus] = useState(false);
  const [exportStatus, setExportStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [exportMessage, setExportMessage] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<{
    id: string;
    name: string;
    url: string;
    cardsCreated?: number;
    hasExported?: boolean;
  } | null>(null);
  
  const [screenSet, setScreenSet] = useState<ScreenSet | null>(null);
  
  useEffect(() => {
    if (!projectId || typeof projectId !== 'string') return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch project data
        const projectData = await projectService.getProjectById(projectId);
        if (!projectData) {
          throw new Error('Project not found');
        }
        setProject(projectData);
        
        // Fetch briefs for this project
        const briefs = await briefService.getBriefsByProjectId(projectId);
        if (!briefs || briefs.length === 0) {
          throw new Error('No briefs found for this project');
        }
        setBrief(briefs[0]);
        
        // Fetch PRDs for this brief
        const prds = await prdService.getPRDsByBriefId(briefs[0].id);
        if (!prds || prds.length === 0) {
          throw new Error('No PRDs found for this brief');
        }
        setPrd(prds[0]);
        
        // Fetch tech doc for this PRD
        const techDocData = await techDocService.getTechDocByPrdId(prds[0].id);
        if (!techDocData) {
          throw new Error('No technical documentation found for this PRD');
        }
        setTechDoc(techDocData);
        
        // Fetch screen data for this PRD
        try {
          const screenData = await screenService.getScreenSetByPrdId(prds[0].id);
          if (screenData) {
            console.log('Screen data found:', screenData);
            setScreenSet(screenData);
          } else {
            console.log('No screen data found for this PRD');
          }
        } catch (screenErr) {
          console.warn('Error fetching screen data:', screenErr);
          // Continue without screen data
        }
        
        // Check if we have implementation guides stored in Supabase
        const storedGuides = await implementationGuideService.getGuideByProjectId(projectId);
        if (storedGuides) {
          setImplementationGuide(storedGuides.implementation_guide);
          setImplementationSteps(storedGuides.implementation_steps);
          setGuideGenerated(true);
          
          // Show warning if using mock data
          if (storedGuides.using_mock) {
            setError('Using mock implementation guides. To generate real guides, please configure your OpenAI API key.');
          }
        }

        // Check if we have Trello export data in localStorage
        const trelloExportData = localStorage.getItem(`trello_export_${projectId}`);
        if (trelloExportData) {
          try {
            const parsedData = JSON.parse(trelloExportData);
            setSelectedBoard({
              id: parsedData.boardId,
              name: parsedData.boardName,
              url: parsedData.boardUrl,
              cardsCreated: parsedData.cardsCreated,
              hasExported: true
            });
          } catch (err) {
            console.error('Error parsing Trello export data from localStorage:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);
  
  const handleGenerateGuides = async () => {
    setGenerating(true);
    setError('');
    
    try {
      if (!project || !brief || !prd || !techDoc) {
        throw new Error('Missing required data for guide generation');
      }
      
      // Generate implementation guides
      const guides = await generateImplementationGuides(project, brief, prd, techDoc, screenSet);
      
      // Update state with generated guides
      setImplementationGuide(guides.implementationGuide);
      setImplementationSteps(guides.implementationSteps);
      setGuideGenerated(true);
      
      // Save guides to Supabase using the existing method
      await implementationGuideService.createOrUpdateGuide(
        project.id,
        guides.implementationGuide,
        guides.implementationSteps,
        false // not using mock
      );
      
    } catch (err) {
      console.error('Error generating guides:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during guide generation');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Function to download content as markdown file
  const handleDownloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle Trello integration status change
  const handleTrelloStatusChange = (status: { connected: boolean; token: string | null }) => {
    setTrelloStatus(status);
  };
  
  // Handle board selection
  const handleBoardSelect = async (boardId: string, boardName: string, isNew: boolean, listId?: string) => {
    setSelectedBoard({
      id: boardId,
      name: boardName,
      url: `https://trello.com/b/${boardId}`,
      hasExported: false
    });
    setShowBoardModal(false);
    setShowExportStatus(true);
    setExportStatus('loading');
    setExportMessage('Exporting features to Trello board...');
    
    if (!prd || !trelloStatus.token) {
      setExportStatus('error');
      setExportMessage('Failed to export: PRD or Trello token not found');
      return;
    }
    
    try {
      // Extract MUST and SHOULD features from PRD
      const features = extractFeaturesFromPRD(prd);
      
      // Export features to Trello
      const result = await trelloService.exportFeaturesToBoard(
        boardId,
        features,
        trelloStatus.token,
        listId
      );
      
      if (result.success) {
        setExportStatus('success');
        setExportMessage(result.message);
        const updatedBoard = {
          ...selectedBoard!,
          cardsCreated: result.cardsCreated,
          url: result.boardUrl,
          hasExported: true
        };
        setSelectedBoard(updatedBoard);
        
        // Save export status to localStorage
        if (projectId && typeof projectId === 'string') {
          localStorage.setItem(`trello_export_${projectId}`, JSON.stringify({
            boardId,
            boardName,
            boardUrl: result.boardUrl,
            cardsCreated: result.cardsCreated,
            exportDate: new Date().toISOString()
          }));
        }
      } else {
        setExportStatus('error');
        setExportMessage(result.message);
      }
    } catch (err) {
      console.error('Error exporting to Trello:', err);
      setExportStatus('error');
      setExportMessage(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  // Extract features from PRD
  const extractFeaturesFromPRD = (prd: PRD) => {
    // Define the feature type to match the ExportFeature interface
    type ExportFeature = {
      title: string;
      description: string;
      priority: 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
    };
    
    const features: ExportFeature[] = [];
    
    try {
      // Check if PRD has content and sections
      if (prd.content && prd.content.sections && Array.isArray(prd.content.sections)) {
        // Map PRD sections to features
        for (const section of prd.content.sections) {
          if (section.featureName && section.featurePriority) {
            // Convert priority to uppercase and ensure it's one of our valid types
            let priority = section.featurePriority.toUpperCase();
            
            // Normalize priority values
            if (priority.includes('MUST')) priority = 'MUST';
            else if (priority.includes('SHOULD')) priority = 'SHOULD';
            else if (priority.includes('COULD')) priority = 'COULD';
            else if (priority.includes('WON\'T') || priority.includes('WONT')) priority = 'WONT';
            else priority = 'SHOULD'; // Default to SHOULD if unknown
            
            // Create description from purpose if available
            let description = '';
            if (section.overview && section.overview.purpose) {
              description = section.overview.purpose;
            }
            
            // Add user stories if available
            if (section.userStories && Array.isArray(section.userStories) && section.userStories.length > 0) {
              description += '\n\nUser Stories:\n';
              section.userStories.forEach((story, index) => {
                description += `${index + 1}. ${story}\n`;
              });
            }
            
            // Add acceptance criteria if available
            if (section.acceptanceCriteria && 
                section.acceptanceCriteria.criteria && 
                Array.isArray(section.acceptanceCriteria.criteria) && 
                section.acceptanceCriteria.criteria.length > 0) {
              description += '\n\nAcceptance Criteria:\n';
              section.acceptanceCriteria.criteria.forEach((criterion, index) => {
                description += `${index + 1}. ${criterion}\n`;
              });
            }
            
            features.push({
              title: section.featureName,
              description: description.trim(),
              priority: priority as 'MUST' | 'SHOULD' | 'COULD' | 'WONT'
            });
          }
        }
      }
      
      // If no features were found in the PRD, use a fallback approach
      if (features.length === 0) {
        console.warn('No features found in PRD sections, attempting to extract from requirements');
        
        // Try to extract from requirements field if it exists
        if (prd.requirements) {
          const lines = prd.requirements.split('\n');
          let currentFeature: { title: string; description: string; priority: 'MUST' | 'SHOULD' | 'COULD' | 'WONT' } | null = null;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for lines that might be feature titles with priorities
            if (trimmedLine.match(/^[A-Z0-9\s\-]+:/) || 
                trimmedLine.match(/^(MUST|SHOULD|COULD|WONT|WON'T):/i)) {
              
              // Save previous feature if exists
              if (currentFeature) {
                features.push(currentFeature);
              }
              
              // Determine priority
              let priority: 'MUST' | 'SHOULD' | 'COULD' | 'WONT' = 'SHOULD';
              if (trimmedLine.includes('MUST') || trimmedLine.includes('must')) {
                priority = 'MUST';
              } else if (trimmedLine.includes('SHOULD') || trimmedLine.includes('should')) {
                priority = 'SHOULD';
              } else if (trimmedLine.includes('COULD') || trimmedLine.includes('could')) {
                priority = 'COULD';
              } else if (trimmedLine.includes('WON\'T') || trimmedLine.includes('WONT') || 
                         trimmedLine.includes('won\'t') || trimmedLine.includes('wont')) {
                priority = 'WONT';
              }
              
              // Extract title
              let title = trimmedLine;
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex !== -1) {
                title = trimmedLine.substring(colonIndex + 1).trim();
              }
              
              currentFeature = {
                title: title || 'Unnamed Feature',
                description: '',
                priority
              };
            } else if (currentFeature && trimmedLine) {
              // Add line to current feature description
              currentFeature.description += (currentFeature.description ? '\n' : '') + trimmedLine;
            }
          }
          
          // Add the last feature if exists
          if (currentFeature) {
            features.push(currentFeature);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting features from PRD:', error);
    }
    
    // If we still have no features, use fallback dummy features
    if (features.length === 0) {
      console.warn('Using fallback features as no features could be extracted from the PRD');
      return [
        {
          title: 'User Authentication',
          description: 'Users should be able to sign up, log in, and manage their accounts.',
          priority: 'MUST' as const
        },
        {
          title: 'Project Creation',
          description: 'Users should be able to create new projects with a name and description.',
          priority: 'MUST' as const
        },
        {
          title: 'Feature Management',
          description: 'Users should be able to add, edit, and delete features within a project.',
          priority: 'MUST' as const
        },
        {
          title: 'Team Collaboration',
          description: 'Users should be able to invite team members to collaborate on projects.',
          priority: 'SHOULD' as const
        },
        {
          title: 'Export to PDF',
          description: 'Users should be able to export project documentation as PDF files.',
          priority: 'SHOULD' as const
        }
      ];
    }
    
    return features;
  };
  
  // Handle Go to Board click
  const handleGoToBoard = () => {
    if (selectedBoard?.url) {
      window.open(selectedBoard.url, '_blank');
    }
  };

  // Handle Export Again click
  const handleExportAgain = () => {
    setShowBoardModal(true);
  };
  
  if (isLoading) {
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#111827] mb-3">Error</h2>
              <p className="text-[#4b5563] mb-8">{error}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setError('')}
                  className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#7c3aed] transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center bg-[#f0f2f5] text-[#4b5563] px-5 py-2.5 rounded-lg font-medium hover:bg-[#e5e7eb] transition-colors"
                >
                  Return to Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
            <Link href="/projects" className="hover:text-[#111827] transition-colors">
              Projects
            </Link>
            <span>/</span>
            {project && (
              <>
                <Link href={`/project/${project.id}`} className="hover:text-[#111827] font-medium transition-colors">
                  {project.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-[#111827]">Implementation Guide</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Implementation Guide</h1>
              <p className="text-[#6b7280] mt-2">Implement {project?.name} with a dev team or AI coding assistants</p>
            </div>
          </div>
        </div>
        
        {/* Warning Banner for Mock Data */}
        {error && error.includes('mock') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Mock Data Warning</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{error}</p>
                  <p className="mt-1">Please add your OpenAI API key to your environment variables to generate real implementation guides.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Banner for Other Errors */}
        {error && !error.includes('mock') && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {!guideGenerated ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">
              Generate Implementation Guides
            </h2>
            <p className="text-[#4b5563] mb-8 max-w-lg mx-auto">
              Create AI-ready implementation guides for your project. This will process your brief, PRD, and technical documentation to create structured instructions for AI coding assistants.
            </p>
            <button
              onClick={handleGenerateGuides}
              disabled={generating}
              className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#7c3aed] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Generate Implementation Guides
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1">
            {/* Development Team Section */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => {
                    const devTeamContent = document.getElementById('dev-team-content');
                    const devTeamDescription = document.getElementById('dev-team-description');
                    if (devTeamContent && devTeamDescription) {
                      devTeamContent.classList.toggle('hidden');
                      devTeamDescription.classList.toggle('hidden');
                      const expandIcon = document.getElementById('dev-team-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="flex items-center text-left flex-1 hover:text-[#111827] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0F533A]/10 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#111827]">Development Team</h2>
                    <p id="dev-team-description" className="text-sm text-[#6b7280] mt-1">Export features to project management tools for team collaboration</p>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    const devTeamContent = document.getElementById('dev-team-content');
                    const devTeamDescription = document.getElementById('dev-team-description');
                    if (devTeamContent && devTeamDescription) {
                      devTeamContent.classList.toggle('hidden');
                      devTeamDescription.classList.toggle('hidden');
                      const expandIcon = document.getElementById('dev-team-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors ml-2"
                  aria-label="Toggle development team section"
                >
                  <svg id="dev-team-expand" className="w-5 h-5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Trello Integration */}
              <div id="dev-team-content" className="transition-all duration-300 hidden">
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-12 h-12 bg-[#0079BF] rounded-md flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.2 3H4.8C3.81 3 3 3.81 3 4.8V19.2C3 20.19 3.81 21 4.8 21H19.2C20.19 21 21 20.19 21 19.2V4.8C21 3.81 20.19 3 19.2 3ZM10.5 16.5C10.5 16.91 10.16 17.25 9.75 17.25H6.75C6.34 17.25 6 16.91 6 16.5V6.75C6 6.34 6.34 6 6.75 6H9.75C10.16 6 10.5 6.34 10.5 6.75V16.5ZM18 12.75C18 13.16 17.66 13.5 17.25 13.5H14.25C13.84 13.5 13.5 13.16 13.5 12.75V6.75C13.5 6.34 13.84 6 14.25 6H17.25C17.66 6 18 6.34 18 6.75V12.75Z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-[#111827]">Trello Integration</h3>
                        {!trelloStatus.connected && (
                          <span className="ml-2 text-xs font-medium bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-full">Connect to use</span>
                        )}
                        {trelloStatus.connected && (
                          <span className="ml-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Connected</span>
                        )}
                      </div>
                      <p className="text-sm text-[#6b7280] mt-1">
                        Export your project as epics and user stories to organize your development workflow
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-4">
                    <div className="flex-1 border border-[#e5e7eb] rounded-lg p-3 bg-white">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-[#ff9f1a] mr-2"></div>
                        <h4 className="font-medium text-[#4b5563] text-sm">Epics</h4>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1 pl-4">Create boards from major features</p>
                    </div>
                    <div className="flex-1 border border-[#e5e7eb] rounded-lg p-3 bg-white">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-[#36b37e] mr-2"></div>
                        <h4 className="font-medium text-[#4b5563] text-sm">User Stories</h4>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1 pl-4">Generate cards from implementation steps</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {!trelloStatus.connected ? (
                      <TrelloIntegration 
                        onStatusChange={handleTrelloStatusChange} 
                        customReturnUrl={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}${window.location.search}` : undefined}
                      />
                    ) : null}
                  </div>
                  
                  {trelloStatus.connected && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {selectedBoard?.hasExported ? (
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-green-600 mb-1">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Exported {selectedBoard.cardsCreated} features to "{selectedBoard.name}"</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={handleGoToBoard}
                              className="inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#0079BF] hover:bg-[#0079BF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079BF]"
                            >
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Go to Board
                            </button>
                            <button 
                              onClick={handleExportAgain}
                              className="inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079BF]"
                            >
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 17L15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 6V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 13L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 13L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 12C22 16.714 22 19.071 20.535 20.535C19.071 22 16.714 22 12 22C7.286 22 4.929 22 3.464 20.535C2 19.071 2 16.714 2 12C2 7.286 2 4.929 3.464 3.464C4.929 2 7.286 2 12 2C16.714 2 19.071 2 20.535 3.464C21.509 4.438 21.836 5.807 21.945 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Export Again
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowBoardModal(true)}
                          className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#0079BF] hover:bg-[#0079BF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0079BF]"
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 17L15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 6V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 13L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 13L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 12C22 16.714 22 19.071 20.535 20.535C19.071 22 16.714 22 12 22C7.286 22 4.929 22 3.464 20.535C2 19.071 2 16.714 2 12C2 7.286 2 4.929 3.464 3.464C4.929 2 7.286 2 12 2C16.714 2 19.071 2 20.535 3.464C21.509 4.438 21.836 5.807 21.945 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Export to Board
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Coding Assistants Section */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => {
                    const aiAssistantContent = document.getElementById('ai-assistant-content');
                    const aiAssistantDescription = document.getElementById('ai-assistant-description');
                    if (aiAssistantContent && aiAssistantDescription) {
                      aiAssistantContent.classList.toggle('hidden');
                      aiAssistantDescription.classList.toggle('hidden');
                      const expandIcon = document.getElementById('ai-assistant-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="flex items-center text-left flex-1 hover:text-[#111827] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#111827]">AI Coding Assistants</h2>
                    <p id="ai-assistant-description" className="text-sm text-[#6b7280] mt-1">Use AI assistants like Cursor, Replit, or Lovable to implement your project</p>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    const aiAssistantContent = document.getElementById('ai-assistant-content');
                    const aiAssistantDescription = document.getElementById('ai-assistant-description');
                    if (aiAssistantContent && aiAssistantDescription) {
                      aiAssistantContent.classList.toggle('hidden');
                      aiAssistantDescription.classList.toggle('hidden');
                      const expandIcon = document.getElementById('ai-assistant-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors ml-2"
                  aria-label="Toggle AI assistant section"
                >
                  <svg id="ai-assistant-expand" className="w-5 h-5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div id="ai-assistant-content" className="transition-all duration-300 hidden">
                {/* How to use with AI coding assistants */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-[#111827]">Implementation Guide Tools</h3>
                  <button
                    onClick={handleGenerateGuides}
                    disabled={generating}
                    className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7c3aed] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15.9 9.75L15.13 15.83C15.01 16.59 14.37 17.15 13.6 17.15H10.4C9.63 17.15 8.99 16.59 8.87 15.83L8.1 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16.5 7.5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 7.5V6.5C14 5.4 13.1 4.5 12 4.5C10.9 4.5 10 5.4 10 6.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Regenerate Guides
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                  
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-base font-semibold text-blue-800">
                          How to use with AI coding assistants
                        </h3>
                        <div className="flex items-center ml-4 space-x-2">
                          <div className="w-8 h-8 rounded-md overflow-hidden shadow-sm border border-gray-200">
                            <img src="/cursor.jpg" alt="Cursor" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-8 h-8 rounded-md overflow-hidden shadow-sm border border-gray-200">
                            <img src="/replit.png" alt="Replit" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-8 h-8 rounded-md overflow-hidden shadow-sm border border-gray-200">
                            <img src="/lovable.jpeg" alt="Lovable" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>These implementation guides are designed specifically for AI coding assistants like Cursor, Lovable, Replit, or other coding tools that can follow structured instructions.</p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                          <li>Generate the Implementation Guide based on your Brief, PRD, Screens, and Tech Doc</li>
                          <li>Copy the generated guides: Implementation Guide and Implementation Steps</li>
                          <li>For Cursor: Download both guides as .md files and place them in your project's source directory</li>
                          <li>Open the AI Assistant in Cursor and paste the 'AI Assistant Prompt'</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* AI Assistant Prompt */}
                <div className="mb-8">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-[#111827]">AI Assistant Prompt</h3>
                      <p className="text-[#6b7280] text-sm">Copy this prompt to use with your AI coding assistant</p>
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard("To get started with this new project follow these instructions carefully: 1) Start by thoroughly reading the implementationguide.md file to understand the project's scope and high-level definitions. 2) Next, read the implementationsteps.md file to familiarize yourself with all the steps required to develop the solution. 3) Create a new file named executionsteps.md to log your progress. 4) Implement Sequentially: Begin implementing the steps one by one, starting from step 1, as outlined in implementationsteps.md. 5) Handle Stages (if present): If the steps in implementationsteps.md are organized under stage headings: a) Complete all steps under a stage heading before moving to the next stage. b) After finishing the last step of a stage, ask the user: 'Stage [X] completed. Are you ready to proceed to Stage [Y]?' before starting the first step of the next stage. c) In executionsteps.md, include the stage headings and list the completed steps under their respective stages, marking each as 'Done'. d) Handle Steps Without Stages: If the steps are not organized into stages, complete each step in order and log them in executionsteps.md with 'Done' after each one. 6) Log Progress: For each completed step, add an entry to executionsteps.md with: The step number, A brief description of the task, The word 'Done', The stage it belongs to (if applicable).")}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f0f2f5] text-[#4b5563] hover:bg-[#e5e7eb] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copy Prompt
                    </button>
                  </div>
                  <div className="bg-[#f8f9fa] rounded-lg p-4 font-mono text-sm text-[#4b5563] whitespace-pre-wrap">
                  To get started with this new project follow these instructions carefully: 1) Start by thoroughly reading the @implementationguide.md file to understand the project's scope and high-level definitions. 2) Next, read the @implementationsteps.md file to familiarize yourself with all the steps required to develop the solution. 3) Create a new file named executionsteps.md to log your progress. 4) Implement Sequentially: Begin implementing the steps one by one, starting from step 1, as outlined in implementationsteps.md. 5) Handle Stages (if present): If the steps in implementationsteps.md are organized under stage headings: a) Complete all steps under a stage heading before moving to the next stage. b) After finishing the last step of a stage, ask the user: Stage [X] completed. Are you ready to proceed to Stage [Y]?" before starting the first step of the next stage. c) In executionsteps.md, include the stage headings and list the completed steps under their respective stages, marking each as "Done". d) Handle Steps Without Stages: If the steps are not organized into stages, complete each step in order and log them in executionsteps.md with "Done" after each one. 6) Log Progress: For each completed step, add an entry to executionsteps.md with: The step number, A brief description of the task, The word "Done", The stage it belongs to (if applicable)
                  </div>
                </div>
                
                {/* Implementation Guide */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-[#111827]">Implementation Guide</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopyToClipboard(implementationGuide)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 17 17V9C17 8.44772 16.5523 8 16 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={() => handleDownloadMarkdown(implementationGuide, 'implementation-guide.md')}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 15V3M12 15L8 11M12 15L16 11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L2 18C2 19.1046 2.89543 20 4 20L20 20C21.1046 20 22 19.1046 22 18L22 17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#6b7280] -mt-2 mb-2 ">Copy or download this info as an .md document for your project files.</p>
                  <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f8f9fa] overflow-auto max-h-[500px]">
                    <pre className="text-sm text-[#374151] whitespace-pre-wrap">{implementationGuide}</pre>
                  </div>
                </div>
                
                {/* Implementation Steps */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-[#111827]">Implementation Steps</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopyToClipboard(implementationSteps)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 17V9C17 8.44772 16.5523 8 16 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={() => handleDownloadMarkdown(implementationSteps, 'implementation-steps.md')}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 15V3M12 15L8 11M12 15L16 11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L2 18C2 19.1046 2.89543 20 4 20L20 20C21.1046 20 22 19.1046 22 18L22 17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#6b7280] -mt-2 mb-2 italic">Copy or download this info as an .md document for your project files.</p>
                  <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f8f9fa] overflow-auto max-h-[500px]">
                    <pre className="text-sm text-[#374151] whitespace-pre-wrap">{implementationSteps}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add the FeedbackModal component */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        projectId={projectId as string}
      />
      
      {/* Trello Board Selection Modal */}
      <TrelloBoardModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        onBoardSelect={handleBoardSelect}
        token={trelloStatus.token || ''}
      />
      
      {/* Trello Export Status Modal */}
      <TrelloExportStatus
        isOpen={showExportStatus}
        onClose={() => setShowExportStatus(false)}
        status={exportStatus}
        message={exportMessage}
        boardName={selectedBoard?.name}
        boardUrl={selectedBoard?.url}
        cardsCreated={selectedBoard?.cardsCreated}
      />
    </div>
  );
} 