import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import EmptyState from '../../components/EmptyState';
import { Project } from '../../utils/projectStore';
import { Brief as BriefStore } from '../../utils/briefStore';
import { Brief as BriefService, briefService } from '../../services/briefService';
import { FeatureSet } from '../../utils/featureStore';
import { prdService } from '../../services/prdService';
import { generatePRD, parsePRD } from '../../utils/prdGenerator';
import MockNotification from '../../components/MockNotification';
import isMockData from '../../utils/mockDetector';
import { projectService } from '../../services/projectService';
import { featureService } from '../../services/featureService';
import { trackEvent } from '../../lib/mixpanelClient';

// Helper function to convert from briefStore.Brief to briefService.Brief
const convertBriefForPRDGenerator = (brief: BriefStore): BriefService => {
  return {
    id: brief.id,
    project_id: brief.projectId,
    product_name: brief.productName,
    form_data: brief.formData,
    brief_data: brief.briefData,
    created_at: brief.createdAt,
    updated_at: brief.createdAt, // Use createdAt as a fallback
    user_id: 'local-user', // Use a placeholder for local storage
    is_editing: brief.isEditing,
    show_edit_buttons: brief.showEditButtons
  };
};

export default function NewPRD() {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<BriefService | null>(null);
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    setUsingMockData(isMockData());
    
    if (!projectId) {
      router.push('/projects');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch project from Supabase
        const foundProject = await projectService.getProjectById(projectId as string);
        if (foundProject) {
          setProject(foundProject);
          
          // Get the brief for this project from Supabase
          const projectBriefs = await briefService.getBriefsByProjectId(foundProject.id);
          if (projectBriefs.length > 0) {
            // There should only be one brief per project
            const projectBrief = projectBriefs[0];
            setBrief(projectBrief);
            
            // Check if features exist for this brief from Supabase
            const briefFeatureSet = await featureService.getFeatureSetByBriefId(projectBrief.id);
            setFeatureSet(briefFeatureSet);
            
            if (!briefFeatureSet || briefFeatureSet.features.length === 0) {
              console.log('No features found for the brief');
            }
          } else {
            setError('No brief found for this project');
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [projectId, router]);

  const handleGeneratePRD = async () => {
    console.log("handleGeneratePRD called", {
      hasBrief: !!brief,
      hasFeatureSet: !!featureSet,
      featureCount: featureSet?.features?.length
    });

    if (!brief) {
      console.log("No brief found");
      setError('No brief found for this project. Please create a brief first.');
      
      // Track the error
      trackEvent('PRD Generation Error', {
        'Error Type': 'Missing Brief',
        'Project ID': projectId as string
      });
      return;
    }
    
    if (!featureSet || featureSet.features.length === 0) {
      console.log("No features found", { featureSet });
      setError('No features available. Please create features first.');
      
      // Track the error
      trackEvent('PRD Generation Error', {
        'Error Type': 'Missing Features',
        'Project ID': projectId as string,
        'Brief ID': brief.id
      });
      return;
    }
    
    try {
      setError(null);
      setIsGenerating(true);
      setGenerationStep('Initializing PRD generation...');
      setProgressPercentage(10);
      
      // Track the start of PRD generation
      trackEvent('PRD Generation Started', {
        'Project ID': projectId as string,
        'Project Name': project?.name,
        'Feature Count': featureSet.features.length,
      });
      
      // Generate the PRD using the brief and feature set
      setGenerationStep('Analyzing features and requirements...');
      setProgressPercentage(30);
      
      console.log("Calling generatePRD with:", {
        briefId: brief.id,
        featureSetId: featureSet.id,
        featureCount: featureSet.features.length
      });

      setGenerationStep('Generating PRD content...');
      setProgressPercentage(50);
      const response = await generatePRD(brief, featureSet);
      
      setGenerationStep('Processing generated content...');
      setProgressPercentage(70);
      setGeneratedPRD(response);
      
      // Automatically save the PRD without requiring user interaction
      setGenerationStep('Parsing and validating PRD...');
      setProgressPercentage(80);
      const parsedPRD = parsePRD(response);
      
      // Create a new PRD object
      setGenerationStep('Saving PRD...');
      setProgressPercentage(90);
      const newPRD = {
        id: crypto.randomUUID(),
        briefId: brief.id,
        featureSetId: featureSet.id,
        title: brief.product_name || 'Untitled PRD',
        overview: typeof brief.brief_data?.proposedSolution === 'string' 
          ? brief.brief_data.proposedSolution 
          : JSON.stringify(brief.brief_data?.proposedSolution || ''),
        goals: typeof brief.brief_data?.productObjectives === 'string' 
          ? brief.brief_data.productObjectives 
          : JSON.stringify(brief.brief_data?.productObjectives || ''),
        userFlows: '',
        requirements: '',
        constraints: '',
        timeline: '',
        content: parsedPRD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const savedPRD = await prdService.savePRD(newPRD);
      setProgressPercentage(100);
      setGenerationStep('Completed! Redirecting...');
      
      // Track successful PRD generation
      trackEvent('PRD Generated Successfully', {
        'Project ID': projectId as string,
        'Project Name': project?.name,
        'PRD ID': savedPRD.id,
        'Feature Count': featureSet.features.length,
        'Generation Time (ms)': Date.now() - (window.performance && window.performance.now ? window.performance.now() : 0),
        'PRD Length': response.length
      });
      
      router.push(`/prd/${savedPRD.id}`);
      
    } catch (error) {
      console.error('Error in PRD generation process:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PRD. Please check your OpenAI API key.');
      
      // Track error in PRD generation
      trackEvent('PRD Generation Failed', {
        'Project ID': projectId as string,
        'Brief ID': brief?.id,
        'Error Message': error instanceof Error ? error.message : 'Unknown error',
        'Generation Step': generationStep,
        'Progress Percentage': progressPercentage
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      setProgressPercentage(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="Project not found"
            description="The project you're trying to create a PRD for doesn't exist"
            icon="project"
            action={{
              href: "/projects",
              text: "Go to projects"
            }}
          />
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="No brief found"
            description="Please create a brief before generating a PRD"
            icon="brief"
            action={{
              href: `/project/${project.id}`,
              text: "Back to project"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/projects" className="text-[#4b5563] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] rounded">
                    Projects
                  </Link>
                </li>
                <li className="text-[#4b5563]">/</li>
                <li>
                  <Link href={`/project/${project?.id}`} className="text-[#4b5563] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] rounded">
                    {project?.name}
                  </Link>
                </li>
                <li className="text-[#4b5563]">/</li>
                <li>
                  <Link href={`/brief/${brief?.id}`} className="text-[#4b5563] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] rounded">
                    Brief
                  </Link>
                </li>
                <li className="text-[#4b5563]">/</li>
                <li>
                  <Link href={`/features/${featureSet?.id}`} className="text-[#4b5563] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F533A] rounded">
                    Features
                  </Link>
                </li>
                <li className="text-[#4b5563]">/</li>
                <li className="text-[#111827] font-medium">New PRD</li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">Product Requirements Document</h1>
            <p className="text-[#4b5563] text-base max-w-3xl">Create a comprehensive document that outlines all the requirements for your product</p>
            
            {usingMockData && <MockNotification stage="prd" />}
          </div>

          {/* PRD Information Section - More compact design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* What is a PRD Card */}
            <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm p-5 flex flex-col h-full">
              <div className="rounded-full bg-[#e6f0eb] w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#111827] mb-3">What is a PRD?</h2>
              <p className="text-[#4b5563] text-sm mb-4 leading-relaxed">
                A Product Requirements Document outlines everything needed to build your product successfully.
              </p>
              <div className="mt-auto">
                <h3 className="text-base font-medium text-[#111827] mb-2">It helps:</h3>
                <ul className="text-[#4b5563] text-sm space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Development teams understand what to build</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Stakeholders align on functionality</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Project managers track progress effectively</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Designers create matching user interfaces</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* What Will Be Generated Card */}
            <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm p-5 flex flex-col h-full">
              <div className="rounded-full bg-[#e6f0eb] w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16M8 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#111827] mb-3">What Will Be Generated?</h2>
              <p className="text-[#4b5563] text-sm mb-4 leading-relaxed">
                Based on your brief and prioritized features, we'll generate a detailed document.
              </p>
              <div className="mt-auto">
                <h3 className="text-base font-medium text-[#111827] mb-2">It includes:</h3>
                <ul className="text-[#4b5563] text-sm space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Detailed feature specifications</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>User stories and acceptance criteria</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Technical requirements</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-[#0F533A] mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Implementation guidelines</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Features Included Card */}
            <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm p-5 flex flex-col h-full">
              <div className="rounded-full bg-[#e6f0eb] w-12 h-12 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22 11V17C22 21 21 22 17 22H7C3 22 2 21 2 17V7C2 3 3 2 7 2H8.5C10 2 10.33 2.44 10.9 3.2L12.4 5.2C12.78 5.7 13 6 14 6H17C21 6 22 7 22 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#111827] mb-3">Features Included</h2>
              <p className="text-[#4b5563] text-sm mb-4 leading-relaxed">
                Your PRD will include all prioritized features from your feature set.
              </p>
              <div className="mt-auto space-y-3">
                <div className="flex items-center bg-[#e6f0eb] rounded-md p-3 transition-transform hover:translate-x-1">
                  <div className="w-2.5 h-2.5 bg-[#0F533A] rounded-full mr-2"></div>
                  <span className="font-medium text-sm text-[#0F533A]">All "Must Have" features</span>
                </div>
                <div className="flex items-center bg-[#e6f0eb] rounded-md p-3 transition-transform hover:translate-x-1">
                  <div className="w-2.5 h-2.5 bg-[#0F533A] rounded-full mr-2"></div>
                  <span className="font-medium text-sm text-[#0F533A]">All "Should Have" features</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generate PRD button */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={handleGeneratePRD}
              disabled={isGenerating || !featureSet || (featureSet && featureSet.features.length === 0)}
              className={`inline-flex items-center justify-center px-6 py-2.5 rounded-md font-medium shadow-sm text-base ${
                isGenerating || !featureSet || (featureSet && featureSet.features.length === 0)
                  ? 'bg-[#d1d5db] text-[#6b7280] cursor-not-allowed'
                  : 'bg-[#0F533A] text-white hover:bg-[#0a3f2c] transition-colors'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate PRD'
              )}
            </button>
            
            {isGenerating && (
              <div className="mt-4 w-full max-w-md">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-[#4b5563]">{generationStep}</span>
                  <span className="text-sm font-medium text-[#0F533A]">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0F533A] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-[#6b7280] text-center">
                  This process may take a few minutes. Please don't close this page.
                </p>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md max-w-3xl mx-auto mb-6 text-sm">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          
        </div>
      </div>
    </div>
  );
} 