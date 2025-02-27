import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import TechDocViewer from '../../components/TechDocViewer';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { TechDoc, techDocStore } from '../../utils/techDocStore';
import { generateTechDocumentation, parseTechDoc } from '../../utils/techDocGenerator';
import MockNotification from '../../components/MockNotification';
import { isMockData } from '../../utils/mockDetector';

export default function TechDocPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [prd, setPRD] = useState<PRD | null>(null);
  const [techDoc, setTechDoc] = useState<TechDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    setUsingMockData(isMockData());
    
    if (id) {
      // First, try to find a PRD with this ID
      const foundPRD = prdStore.getPRD(id as string);
      
      if (foundPRD) {
        // If we found a PRD, use it
        setPRD(foundPRD);
        const foundBrief = briefStore.getBrief(foundPRD.briefId);
        setBrief(foundBrief);
        
        if (foundBrief) {
          const foundProject = projectStore.getProject(foundBrief.projectId);
          setProject(foundProject);
          
          // Check if tech doc exists for this PRD
          const existingTechDoc = techDocStore.getTechDocByPrdId(foundPRD.id);
          setTechDoc(existingTechDoc);
        }
      } else {
        // If no PRD found, check if this is a brief ID
        const foundBrief = briefStore.getBrief(id as string);
        setBrief(foundBrief);
        
        if (foundBrief) {
          const foundProject = projectStore.getProject(foundBrief.projectId);
          setProject(foundProject);
          
          // Check if a PRD exists for this brief
          const existingPRD = prdStore.getPRDByBriefId(foundBrief.id);
          if (existingPRD) {
            setPRD(existingPRD);
            
            // Check if tech doc exists for this PRD
            const existingTechDoc = techDocStore.getTechDocByPrdId(existingPRD.id);
            setTechDoc(existingTechDoc);
          }
        }
      }
      
      setIsLoading(false);
    }
  }, [id]);

  const handleGenerateTechDoc = async () => {
    if (!brief || !prd) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await generateTechDocumentation(brief, prd);
      const parsedTechDoc = parseTechDoc(response);
      
      // Save the generated tech doc
      const savedTechDoc = techDocStore.saveTechDoc(prd.id, parsedTechDoc);
      setTechDoc(savedTechDoc);
    } catch (err) {
      console.error('Error generating tech documentation:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTechDoc = () => {
    if (!techDoc || !project) return;
    
    if (window.confirm(`Are you sure you want to delete this technical documentation?\n\nThis action cannot be undone.`)) {
      const deleted = techDocStore.deleteTechDoc(techDoc.id);
      if (deleted) {
        setTechDoc(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3 text-[#6b7280]">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brief || !project || !prd) {
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
            <h2 className="text-xl font-semibold text-[#111827] mb-3">PRD not found</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">Please create a PRD before generating technical documentation</p>
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
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-10">
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
            <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
              Brief
            </Link>
            <span>/</span>
            <Link href={`/prd/${prd.id}`} className="hover:text-[#111827] transition-colors">
              PRD
            </Link>
            <span>/</span>
            <span className="text-[#111827]">Technical Documentation</span>
          </div>
          
          {usingMockData && <MockNotification stage="tech-docs" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Technical Documentation</h1>
              <p className="text-[#6b7280] mt-2">Technical specifications for {brief.productName}</p>
            </div>
            <div className="flex items-center space-x-3 self-start">
              {techDoc && (
                <button
                  onClick={handleDeleteTechDoc}
                  className="inline-flex items-center justify-center bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete Documentation
                </button>
              )}
              <Link
                href={`/prd/${prd.id}`}
                className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to PRD
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {!techDoc ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Generate Technical Documentation</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-[#4b5563]">
                  Generate comprehensive technical documentation based on your PRD. This will help your development team understand the technical requirements and implementation details.
                </p>
                
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                  <p className="font-medium">Note</p>
                  <p>The technical documentation will include:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Tech Stack Documentation: Recommended frameworks and technologies</li>
                    <li>Frontend Guidelines: UI consistency guidelines and color palette</li>
                    <li>Backend Structure: API routes, database schemas, and core logic</li>
                  </ul>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateTechDoc}
                    disabled={isGenerating}
                    className={`inline-flex items-center justify-center bg-[#8b5cf6] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#7c3aed] transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                      <>
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 12H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12.5 15L15.5 12L12.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 6C2.75 7.67 2 9.75 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C10.57 2 9.2 2.3 7.97 2.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Generate Documentation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <TechDocViewer techDoc={techDoc} onUpdate={(updatedTechDoc) => setTechDoc(updatedTechDoc)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
