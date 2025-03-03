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
        
        // Check if we have implementation guides stored locally
        const storedGuides = localStorage.getItem(`implementation_guides_${projectId}`);
        if (storedGuides) {
          const { guide, steps, usingMock } = JSON.parse(storedGuides);
          setImplementationGuide(guide);
          setImplementationSteps(steps);
          setGuideGenerated(true);
          
          // Show warning if using mock data
          if (usingMock) {
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
    if (!project || !brief || !prd || !techDoc) return;
    
    setGenerating(true);
    try {
      // Check if OpenAI API key is available
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      const usingMock = !apiKey && typeof window !== 'undefined';
      
      // Generate the guides
      const { implementationGuide: guide, implementationSteps: steps } = await generateImplementationGuides(project, brief, prd, techDoc);
      
      setImplementationGuide(guide);
      setImplementationSteps(steps);
      setGuideGenerated(true);
      
      // Store the generated guides locally
      localStorage.setItem(`implementation_guides_${projectId}`, JSON.stringify({
        guide,
        steps,
        usingMock
      }));
      
      // Show warning if using mock data
      if (usingMock) {
        setError('Using mock implementation guides. To generate real guides, please configure your OpenAI API key.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error generating implementation guides:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate implementation guides');
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
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors"
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
              <p className="text-[#6b7280] mt-2">AI-ready implementation instructions for {project?.name}</p>
            </div>
            {guideGenerated && (
              <button
                onClick={handleGenerateGuides}
                disabled={generating}
                className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
        
        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to use with AI coding assistants</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>These implementation guides are designed specifically for AI coding assistants like Cursor, Lovable, Replit, or other coding tools that can follow structured instructions.</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Generate the Implementation Guide based on your Brief, PRD, Screens, and Tech Doc</li>
                  <li>Copy the generated guides: Implementation Guide and Implementation Steps</li>
                  <li>For Cursor: Download both guides as .md files and place them in your project's source directory</li>
                  <li>Open the files in Cursor and ask the assistant to implement the code based on these instructions with a prompt like: "Please read through these implementation guides and build the project following the steps outlined. After each step is completed, mark it as 'Done' before moving to the next step."</li>
                </ol>
                <p className="mt-2">The guides are structured to help AI systems understand your project requirements and generate appropriate code. For best results in Cursor, keep the .md files in your project's source directory while implementing.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Prompt Section */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-2">AI Assistant Prompt</h2>
              <p className="text-[#6b7280] text-sm mb-4">Copy this prompt to use with your AI coding assistant</p>
            </div>
            <button
              onClick={() => handleCopyToClipboard("Please read through the @ implementationguides.md and build the project following the @ implementationsteps.md outlined. Create a new file called executionsteps.md and after each step is completed, mark it as 'Done' before moving to the next step.")}
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
            Please read through the @ implementationguides.md and build the project following the @ implementationsteps.md outlined. Create a new file called executionsteps.md and after each step is completed, mark it as 'Done' before moving to the next step.
          </div>
        </div>
        
        {!guideGenerated ? (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-[#0F533A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
            {/* Implementation Guide */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Implementation Guide</h2>
                </div>
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
              <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f8f9fa] overflow-auto max-h-[500px]">
                <pre className="text-sm text-[#374151] whitespace-pre-wrap">{implementationGuide}</pre>
              </div>
            </div>
            
            {/* Implementation Steps */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Implementation Steps</h2>
                </div>
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
              <div className="border border-[#e5e7eb] rounded-lg p-4 bg-[#f8f9fa] overflow-auto max-h-[500px]">
                <pre className="text-sm text-[#374151] whitespace-pre-wrap">{implementationSteps}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 