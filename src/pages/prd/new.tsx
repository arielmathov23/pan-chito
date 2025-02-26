import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import EmptyState from '../../components/EmptyState';
import PRDForm, { PRDFormData } from '../../components/PRDForm';
import { Project, projectStore } from '../../utils/projectStore';
import { prdStore } from '../../utils/prdStore';
import { generatePRD } from '../../utils/openai';

export default function NewPRD() {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = useState<PRDFormData | null>(null);

  useEffect(() => {
    if (!projectId) {
      router.push('/projects');
      return;
    }

    // Fetch project from store
    const foundProject = projectStore.getProject(projectId as string);
    setProject(foundProject);
    setIsLoading(false);
  }, [projectId, router]);

  const handleSubmit = async (formData: PRDFormData) => {
    try {
      setError(null);
      setCurrentFormData(formData);
      setIsGenerating(true);
      
      const prdContent = await generatePRD(formData);
      setGeneratedPRD(prdContent);
    } catch (error) {
      console.error('Error generating PRD:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PRD. Please check your OpenAI API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePRD = () => {
    if (!project || !generatedPRD || !currentFormData) return;
    
    try {
      prdStore.savePRD(project.id, currentFormData, generatedPRD);
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
              <PRDForm 
                projectId={project?.id || ''} 
                onSubmit={handleSubmit} 
                isGenerating={isGenerating}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 