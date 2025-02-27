import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import EmptyState from '../../components/EmptyState';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { FeatureSet, featureStore } from '../../utils/featureStore';
import { prdStore } from '../../utils/prdStore';
import { generatePRD, parsePRD } from '../../utils/prdGenerator';

export default function NewPRD() {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      router.push('/projects');
      return;
    }

    // Fetch project from store
    const foundProject = projectStore.getProject(projectId as string);
    if (foundProject) {
      setProject(foundProject);
      
      // Get all briefs for this project
      const projectBriefs = briefStore.getBriefs(foundProject.id);
      setBriefs(projectBriefs);
      
      // If there's only one brief, select it automatically
      if (projectBriefs.length === 1) {
        setSelectedBriefId(projectBriefs[0].id);
        
        // Check if features exist for this brief
        const briefFeatureSet = featureStore.getFeatureSetByBriefId(projectBriefs[0].id);
        setFeatureSet(briefFeatureSet);
      }
    }
    
    setIsLoading(false);
  }, [projectId, router]);

  // Handle brief selection change
  const handleBriefChange = (briefId: string) => {
    setSelectedBriefId(briefId);
    setFeatureSet(featureStore.getFeatureSetByBriefId(briefId));
    setGeneratedPRD(null);
    setError(null);
  };

  const handleGeneratePRD = async () => {
    if (!selectedBriefId || !featureSet) {
      setError('Please select a brief with features to generate a PRD');
      return;
    }
    
    const brief = briefStore.getBrief(selectedBriefId);
    if (!brief) {
      setError('Selected brief not found');
      return;
    }
    
    try {
      setError(null);
      setIsGenerating(true);
      
      const response = await generatePRD(brief, featureSet);
      setGeneratedPRD(response);
    } catch (error) {
      console.error('Error generating PRD:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PRD. Please check your OpenAI API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePRD = () => {
    if (!project || !generatedPRD || !selectedBriefId || !featureSet) return;
    
    try {
      const brief = briefStore.getBrief(selectedBriefId);
      if (!brief) {
        setError('Selected brief not found');
        return;
      }
      
      const parsedPRD = parsePRD(generatedPRD);
      const savedPRD = prdStore.savePRD(brief.id, featureSet.id, parsedPRD);
      router.push(`/project/${project.id}`);
    } catch (error) {
      setError('Failed to save PRD. Please try again.');
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

  if (briefs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="No briefs found"
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/project/${project?.id}`} className="hover:text-foreground transition-colors">
                {project?.name}
              </Link>
              <span>/</span>
              <span className="text-foreground">New PRD</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create New PRD</h1>
            <p className="text-muted-foreground mt-2">Document the requirements for your product</p>
          </div>

          {generatedPRD ? (
            <div className="bg-card rounded-xl border border-border/40 shadow-card p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Generated PRD</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setGeneratedPRD(null);
                      setError(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleSavePRD}
                    className="inline-flex items-center justify-center bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save PRD
                  </button>
                </div>
              </div>
              <div className="prose prose-gray max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {generatedPRD}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/40 shadow-card p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="brief" className="block text-sm font-medium text-foreground mb-2">
                    Select Brief
                  </label>
                  <select
                    id="brief"
                    value={selectedBriefId}
                    onChange={(e) => handleBriefChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select a brief</option>
                    {briefs.map((brief) => (
                      <option key={brief.id} value={brief.id}>
                        {brief.productName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBriefId && !featureSet && (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-lg">
                    <p className="font-medium">Features Required</p>
                    <p>Please generate or define features for this brief before creating a PRD.</p>
                    <Link
                      href={`/brief/${selectedBriefId}/ideate`}
                      className="inline-flex items-center mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                    >
                      Go to Feature Ideation
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                )}

                {selectedBriefId && featureSet && (
                  <>
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                      <p className="font-medium">Ready to Generate</p>
                      <p>The PRD will include all features with "Must" and "Should" priorities from your feature set.</p>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                        <p className="font-medium">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button
                        onClick={handleGeneratePRD}
                        disabled={isGenerating}
                        className={`inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating PRD...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Generate PRD
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 