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
    if (!project || !brief || !prd || !techDoc || !projectId || typeof projectId !== 'string') {
      setError('Missing required data. Please ensure all project data is available.');
      return;
    }
    
    setGenerating(true);
    setError(''); // Clear any previous errors
    
    try {
      // Check if OpenAI API key is available
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      const usingMock = !apiKey && typeof window !== 'undefined';
      
      console.log('Generating implementation guides for project:', projectId);
      
      // Generate the guides
      let guide, steps;
      try {
        const result = await generateImplementationGuides(project, brief, prd, techDoc);
        guide = result.implementationGuide;
        steps = result.implementationSteps;
        
        if (!guide || !steps) {
          throw new Error('Failed to generate implementation guides. The response was empty.');
        }
      } catch (genError) {
        console.error('Error in guide generation step:', genError);
        throw new Error(`Guide generation failed: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
      }
      
      console.log('Guides generated, saving to database...');
      
      // Save to Supabase
      try {
        const savedGuide = await implementationGuideService.createOrUpdateGuide(
          projectId,
          guide,
          steps,
          usingMock
        );

        if (!savedGuide) {
          throw new Error('Failed to save implementation guides. The response was empty.');
        }
        
        setImplementationGuide(savedGuide.implementation_guide);
        setImplementationSteps(savedGuide.implementation_steps);
        setGuideGenerated(true);
        
        // Show warning if using mock data
        if (usingMock) {
          setError('Using mock implementation guides. To generate real guides, please configure your OpenAI API key.');
        } else {
          setError('');
        }

        // Show feedback modal after 10 seconds
        setTimeout(() => {
          setShowFeedbackModal(true);
        }, 10000);
      } catch (saveError) {
        console.error('Error saving guides to database:', saveError);
        throw new Error(`Failed to save guides: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error in handleGenerateGuides:', err);
      
      // Set a user-friendly error message
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes('API key')) {
          setError('OpenAI API key is missing or invalid. Please configure your API key in the settings.');
        } else if (err.message.includes('rate limit')) {
          setError('OpenAI API rate limit exceeded. Please try again later.');
        } else if (err.message.includes('User not authenticated')) {
          setError('You need to be logged in to generate implementation guides. Please log in and try again.');
        } else if (err.message.includes('Project not found')) {
          setError('Project not found or you do not have access to it. Please check the project ID.');
        } else if (err.message.includes('content format') || err.message.includes('406')) {
          console.error('Content-type negotiation error:', err);
          setError('There was an issue with the content format. Please try again with smaller content or contact support.');
        } else if (err.message.includes('malformed data') || err.message.includes('400')) {
          console.error('Bad request error:', err);
          setError('The request was invalid. This may be due to malformed data or content size limits. Try simplifying your project content.');
        } else {
          setError(`Failed to generate implementation guides: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while generating implementation guides. Please try again later.');
      }
    } finally {
      setGenerating(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            {guideGenerated && (
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
            )}
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
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    const devTeamContent = document.getElementById('dev-team-content');
                    if (devTeamContent) {
                      devTeamContent.classList.toggle('hidden');
                      const expandIcon = document.getElementById('dev-team-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="flex items-center text-left flex-1 hover:text-[#111827] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Development Team</h2>
                </button>
                <button 
                  onClick={() => {
                    const devTeamContent = document.getElementById('dev-team-content');
                    if (devTeamContent) {
                      devTeamContent.classList.toggle('hidden');
                      const expandIcon = document.getElementById('dev-team-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <svg id="dev-team-expand" className="w-5 h-5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Trello Integration - Coming Soon */}
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
                        <span className="ml-2 text-xs font-medium bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-full">Coming Soon</span>
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
                  
                  <button disabled className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-[#0079BF] text-white opacity-50 cursor-not-allowed">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Connect to Trello
                  </button>
                </div>
              </div>
            </div>
            
            {/* AI Coding Assistants Section */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    const aiAssistantContent = document.getElementById('ai-assistant-content');
                    if (aiAssistantContent) {
                      aiAssistantContent.classList.toggle('hidden');
                      const expandIcon = document.getElementById('ai-assistant-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="flex items-center text-left flex-1 hover:text-[#111827] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">AI Coding Assistants</h2>
                </button>
                <button 
                  onClick={() => {
                    const aiAssistantContent = document.getElementById('ai-assistant-content');
                    if (aiAssistantContent) {
                      aiAssistantContent.classList.toggle('hidden');
                      const expandIcon = document.getElementById('ai-assistant-expand');
                      if (expandIcon) {
                        expandIcon.classList.toggle('rotate-180');
                      }
                    }
                  }}
                  className="text-[#6b7280] hover:text-[#111827] transition-colors"
                >
                  <svg id="ai-assistant-expand" className="w-5 h-5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div id="ai-assistant-content" className="transition-all duration-300">
                {/* How to use with AI coding assistants */}
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
                    <button
                      onClick={() => handleCopyToClipboard(implementationGuide)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 19V9C17 8.44772 16.5523 8 16 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-[#6b7280] -mt-2 mb-2 ">Copy this info and paste it as an .md document in Directory files.</p>
                  <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f8f9fa] overflow-auto max-h-[500px]">
                    <pre className="text-sm text-[#374151] whitespace-pre-wrap">{implementationGuide}</pre>
                  </div>
                </div>
                
                {/* Implementation Steps */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-[#111827]">Implementation Steps</h3>
                    <button
                      onClick={() => handleCopyToClipboard(implementationSteps)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm bg-[#f0f2f5] hover:bg-[#e5e7eb] text-[#4b5563] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 19V9C17 8.44772 16.5523 8 16 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-[#6b7280] -mt-2 mb-2 italic">Copy this info and paste it as an .md document in Directory files.</p>
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
    </div>
  );
} 