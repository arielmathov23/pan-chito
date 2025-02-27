import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import MockNotification from '../../components/MockNotification';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { FeatureSet, featureStore } from '../../utils/featureStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { generatePRD, parsePRD } from '../../utils/prdGenerator';
import PRDViewer from '../../components/PRDViewer';
import { techDocStore } from '../../utils/techDocStore';
import isMockData from '../../utils/mockDetector';

export default function PRDPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [prd, setPRD] = useState<PRD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
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
          
          // Check if features exist for this brief
          const existingFeatureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
          setFeatureSet(existingFeatureSet);
        }
      } else {
        // If no PRD found, check if this is a brief ID
        const foundBrief = briefStore.getBrief(id as string);
        setBrief(foundBrief);
        
        if (foundBrief) {
          const foundProject = projectStore.getProject(foundBrief.projectId);
          setProject(foundProject);
          
          // Check if features exist for this brief
          const existingFeatureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
          setFeatureSet(existingFeatureSet);
          
          // Check if a PRD exists for this brief
          const existingPRD = prdStore.getPRDByBriefId(foundBrief.id);
          if (existingPRD) {
            setPRD(existingPRD);
          }
        }
      }
      
      setIsLoading(false);
      
      // Check if mock data is being used
      setUsingMockData(isMockData());
    }
  }, [id]);

  const handleGeneratePRD = async () => {
    if (!brief || !featureSet) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await generatePRD(brief, featureSet);
      const parsedPRD = parsePRD(response);
      
      // Save the generated PRD
      const savedPRD = prdStore.savePRD(brief.id, featureSet.id, parsedPRD);
      setPRD(savedPRD);
    } catch (err) {
      console.error('Error generating PRD:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePRD = () => {
    if (!prd || !project) return;
    
    if (window.confirm(`Are you sure you want to delete this PRD?\n\nThis action cannot be undone.`)) {
      const deleted = prdStore.deletePRD(prd.id);
      if (deleted) {
        router.push(`/project/${project.id}`);
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
              <span>Loading brief...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brief || !project) {
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
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Brief not found</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">The brief you're looking for doesn't exist</p>
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

  if (!featureSet) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#6b7280]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Features Required</h2>
            <p className="text-[#4b5563] mb-8 max-w-md mx-auto">Please generate or define features before creating the PRD</p>
            <Link
              href={`/brief/${brief.id}/ideate`}
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              Go to Feature Ideation
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
            <span className="text-[#111827]">PRD</span>
          </div>
          {usingMockData && <MockNotification stage="prd" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Product Requirements Document</h1>
              <p className="text-[#6b7280] mt-2">Detailed specifications for {brief.productName}</p>
            </div>
            <div className="flex items-center space-x-3 self-start">
              {prd && (
                <button
                  onClick={handleDeletePRD}
                  className="inline-flex items-center justify-center bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete PRD
                </button>
              )}
              {prd && (
                <Link
                  href={`/screens/${prd.id}`}
                  className="inline-flex items-center justify-center bg-[#8b5cf6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7c3aed] transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  App Screens
                </Link>
              )}
              {prd && (
                <Link
                  href={`/docs/${prd.id}`}
                  className="inline-flex items-center justify-center bg-white border border-[#8b5cf6] text-[#8b5cf6] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f5f3ff] transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {techDocStore.getTechDocByPrdId(prd.id) ? 'View Tech Docs' : 'Create Tech Docs'}
                </Link>
              )}
              <Link
                href={`/brief/${brief.id}/ideate`}
                className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Features
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {!prd ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                  <h2 className="text-xl font-semibold text-[#111827]">Generate PRD</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-[#4b5563]">
                  Generate a comprehensive Product Requirements Document based on your brief and selected features.
                  This will help you define detailed specifications, user stories, and technical requirements for your MVP.
                </p>
                
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                  <p className="font-medium">Note</p>
                  <p>The PRD will include all features with "Must" and "Should" priorities. Each feature will be tagged with its priority in the document.</p>
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
                    className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
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
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <PRDViewer prd={prd} onUpdate={(updatedPRD) => setPRD(updatedPRD)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 