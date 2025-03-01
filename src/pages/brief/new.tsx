import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BriefForm, { BriefFormData } from '../../components/BriefForm';
import { Project, projectService } from '../../services/projectService';
import { Brief, briefService } from '../../services/briefService';
import { generateBrief, GeneratedBrief } from '../../utils/briefGenerator';
import MockNotification from '../../components/MockNotification';
import { isMockData } from '../../utils/mockDetector';

// Helper function to safely render potentially stringified JSON
function RenderField({ content }: { content: string }) {
  // Check if the content is a stringified JSON object
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      // Render as a formatted object
      return (
        <div className="bg-[#f8f9fa] p-4 rounded-lg">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="font-medium">{key}: </span>
              <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      );
    }
  } catch (e) {
    // Not a JSON string, continue with normal rendering
  }
  
  // Regular string content
  return <p className="text-[#4b5563] whitespace-pre-wrap">{content}</p>;
}

export default function NewBrief() {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);
  const [parsedBrief, setParsedBrief] = useState<GeneratedBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = useState<BriefFormData | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    setUsingMockData(isMockData());
    
    if (!projectId) {
      router.push('/projects');
      return;
    }

    // Fetch project from Supabase
    const fetchProject = async () => {
      try {
        const foundProject = await projectService.getProjectById(projectId as string);
        setProject(foundProject);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to fetch project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  useEffect(() => {
    if (generatedBrief) {
      try {
        const parsed = JSON.parse(generatedBrief) as GeneratedBrief;
        setParsedBrief(parsed);
      } catch (error) {
        console.error('Error parsing brief JSON:', error);
        setError('Failed to parse the generated brief. Please try again.');
      }
    }
  }, [generatedBrief]);

  const handleSubmit = async (formData: BriefFormData) => {
    try {
      setError(null);
      setCurrentFormData(formData);
      setIsGenerating(true);
      
      const briefContent = await generateBrief(formData);
      setGeneratedBrief(briefContent);
    } catch (error) {
      console.error('Error generating Brief:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate Brief. Please check your OpenAI API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBrief = async () => {
    if (!project || !generatedBrief || !currentFormData) return;
    
    try {
      setIsSaving(true);
      
      // Save the brief to Supabase
      const savedBrief = await briefService.createBrief(
        project.id, 
        currentFormData, 
        generatedBrief,
        false,
        false
      );
      
      // Navigate to the ideation page
      router.push(`/brief/${savedBrief.id}/ideate`);
    } catch (error) {
      console.error('Error saving brief:', error);
      setError('Failed to save brief. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForEditing = async () => {
    if (!project || !generatedBrief || !currentFormData) return;
    
    try {
      setIsSaving(true);
      
      // Save the brief to Supabase with editing mode enabled
      const savedBrief = await briefService.createBrief(
        project.id, 
        currentFormData, 
        generatedBrief,
        true,
        true
      );
      
      // Navigate to the brief detail page
      router.push(`/brief/${savedBrief.id}`);
    } catch (error) {
      console.error('Error saving brief for editing:', error);
      setError('Failed to save brief for editing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#0F533A] border-t-transparent animate-spin mb-4"></div>
            <p className="text-[#6b7280]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Project not found</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">The project you're trying to create a brief for doesn't exist</p>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              Go to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      
      {usingMockData && <div className="container mx-auto px-6 pt-6"><MockNotification stage="brief" /></div>}
      
      {generatedBrief && parsedBrief ? (
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Projects
              </Link>
              <span>/</span>
              <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                {project.name}
              </Link>
              <span>/</span>
              <span className="text-[#111827]">New Brief</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Generated Brief</h1>
          </div>
          
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#111827]">{currentFormData?.productName}</h2>
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveForEditing}
                  disabled={isSaving}
                  className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Edit'}
                </button>
                <button
                  onClick={handleSaveBrief}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Continue'}
                </button>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Executive Summary */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Executive Summary</h3>
                <RenderField content={parsedBrief.executiveSummary} />
              </div>
              
              {/* Problem Statement */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Problem Statement</h3>
                <RenderField content={parsedBrief.problemStatement} />
              </div>
              
              {/* Target Users */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Target Users</h3>
                <RenderField content={parsedBrief.targetUsers} />
              </div>
              
              {/* Existing Solutions */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Existing Solutions</h3>
                <RenderField content={parsedBrief.existingSolutions} />
              </div>
              
              {/* Proposed Solution */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Proposed Solution</h3>
                <RenderField content={parsedBrief.proposedSolution} />
              </div>
              
              {/* Product Objectives */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Product Objectives</h3>
                <RenderField content={parsedBrief.productObjectives} />
              </div>
              
              {/* Key Features */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Key Features</h3>
                <RenderField content={parsedBrief.keyFeatures} />
              </div>
              
              {/* Market Analysis */}
              {parsedBrief.marketAnalysis && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Market Analysis</h3>
                  <RenderField content={parsedBrief.marketAnalysis} />
                </div>
              )}
              
              {/* Technical Risks */}
              {parsedBrief.technicalRisks && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Technical Risks</h3>
                  <RenderField content={parsedBrief.technicalRisks} />
                </div>
              )}
              
              {/* Business Risks */}
              {parsedBrief.businessRisks && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Business Risks</h3>
                  <RenderField content={parsedBrief.businessRisks} />
                </div>
              )}
              
              {/* Implementation Strategy */}
              {parsedBrief.implementationStrategy && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Implementation Strategy</h3>
                  <RenderField content={parsedBrief.implementationStrategy} />
                </div>
              )}
              
              {/* Success Metrics */}
              {parsedBrief.successMetrics && (
                <div>
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Success Metrics</h3>
                  <RenderField content={parsedBrief.successMetrics} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-6 py-10 max-w-3xl">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              <Link href="/projects" className="hover:text-[#111827] transition-colors flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Projects
              </Link>
              <span>/</span>
              <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                {project.name}
              </Link>
              <span>/</span>
              <span className="text-[#111827]">New Brief</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Create Product Brief</h1>
                <p className="text-[#6b7280] mt-1">For project: <span className="font-medium text-[#111827]">{project.name}</span></p>
              </div>
              <Link
                href={`/project/${project.id}`}
                className="self-start inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#6b7280] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cancel
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 md:p-8">
            <BriefForm 
              projectId={project.id} 
              onSubmit={handleSubmit} 
              isGenerating={isGenerating}
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  );
} 