import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import MockNotification from '../../components/MockNotification';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief as BriefStore, briefStore } from '../../utils/briefStore';
import { Brief as BriefService, briefService } from '../../services/briefService';
import { FeatureSet, featureStore } from '../../utils/featureStore';
import { PRD, prdService } from '../../services/prdService';
import { generatePRD, parsePRD, GeneratedPRD } from '../../utils/prdGenerator';
import PRDViewer from '../../components/PRDViewer';
import { techDocStore } from '../../utils/techDocStore';
import isMockData from '../../utils/mockDetector';
import { projectService } from '../../services/projectService';
import { prdToMarkdown, downloadAsFile } from '../../utils/downloadUtils';

// Helper function to safely render content that might be an object
const safeRender = (content: any): string => {
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  return JSON.stringify(content, null, 2);
};

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

export default function PRDPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<BriefStore | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [featureSet, setFeatureSet] = useState<FeatureSet | null>(null);
  const [prd, setPRD] = useState<PRD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [briefRequired, setBriefRequired] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showInfoContent, setShowInfoContent] = useState(false);

  // Function to save current state to sessionStorage
  const saveStateToSession = () => {
    if (!id || !dataLoaded) return;
    
    try {
      const stateToSave = {
        prd: prd,
        brief: brief,
        project: project,
        featureSet: featureSet,
        timestamp: new Date().getTime()
      };
      
      sessionStorage.setItem(`prd_page_${id}`, JSON.stringify(stateToSave));
      console.log("Saved state to session storage");
    } catch (error) {
      console.error("Error saving state to session storage:", error);
    }
  };

  // Function to load state from sessionStorage
  const loadStateFromSession = (): boolean => {
    if (!id) return false;
    
    try {
      const savedState = sessionStorage.getItem(`prd_page_${id}`);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const timestamp = parsedState.timestamp;
        
        // Only use cached data if it's less than 5 minutes old
        if (timestamp && (new Date().getTime() - timestamp < 5 * 60 * 1000)) {
          console.log("Loading state from session storage");
          setPRD(parsedState.prd);
          setBrief(parsedState.brief);
          setProject(parsedState.project);
          setFeatureSet(parsedState.featureSet);
          setDataLoaded(true);
          setIsLoading(false);
          return true;
        } else {
          console.log("Cached data is too old, fetching fresh data");
          sessionStorage.removeItem(`prd_page_${id}`);
        }
      }
    } catch (error) {
      console.error("Error loading state from session storage:", error);
    }
    
    return false;
  };

  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check if we already have data
        if (dataLoaded) {
          console.log("Tab is visible again, data already loaded");
        } else {
          // Try to load from session storage
          const loaded = loadStateFromSession();
          if (!loaded) {
            console.log("No cached data available, will load fresh data");
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // When tab is hidden, save current state
        saveStateToSession();
      }
    };

    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, dataLoaded, prd, brief, project, featureSet]);

  // Save state to session when component unmounts or when data changes
  useEffect(() => {
    if (dataLoaded) {
      saveStateToSession();
    }
  }, [dataLoaded, prd, brief, project, featureSet]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      // Try to load from session storage first
      if (loadStateFromSession()) {
        // If we successfully loaded from session storage, we're done
        setUsingMockData(isMockData());
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Loading PRD with ID:", id);
        
        // First, try to find a PRD with this ID
        const foundPRD = await prdService.getPRDById(id as string);
        
        if (foundPRD) {
          // If we found a PRD, use it
          console.log("Found PRD:", foundPRD);
          setPRD(foundPRD);
          // Don't show info content when viewing an existing PRD
          setShowInfoContent(false);
          
          // For viewing an existing PRD, we don't strictly need the brief
          // We'll try to load it, but won't block the UI if it's not found
          console.log("Looking for brief with ID:", foundPRD.briefId);
          const foundBrief = briefStore.getBrief(foundPRD.briefId);
          
          if (foundBrief) {
            console.log("Found brief:", foundBrief);
            setBrief(foundBrief);
            
            // Load the associated project
            console.log("Looking for project with ID:", foundBrief.projectId);
            const foundProject = projectStore.getProject(foundBrief.projectId);
            console.log("Found project:", foundProject);
            setProject(foundProject);
            
            // Check if features exist for this brief
            const existingFeatureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
            console.log("Found feature set:", existingFeatureSet);
            setFeatureSet(existingFeatureSet);
          } else {
            console.log("Brief not found for PRD:", foundPRD.briefId);
            console.log("This is OK for viewing an existing PRD");
            
            // Try to load the brief from Supabase as a fallback, but don't block the UI
            try {
              console.log("Attempting to load brief from Supabase:", foundPRD.briefId);
              const briefFromService = await briefService.getBriefById(foundPRD.briefId);
              
              if (briefFromService) {
                console.log("Found brief from service:", briefFromService);
                
                // Convert to the format expected by the component
                const convertedBrief: BriefStore = {
                  id: briefFromService.id,
                  projectId: briefFromService.project_id,
                  productName: briefFromService.product_name,
                  problemStatement: briefFromService.brief_data?.problemStatement || "",
                  targetUsers: briefFromService.brief_data?.targetUsers || "",
                  proposedSolution: briefFromService.brief_data?.proposedSolution || "",
                  productObjectives: briefFromService.brief_data?.productObjectives || "",
                  createdAt: briefFromService.created_at,
                  content: JSON.stringify(briefFromService.brief_data),
                  briefData: briefFromService.brief_data,
                  formData: briefFromService.form_data,
                  isEditing: false,
                  showEditButtons: false
                };
                
                setBrief(convertedBrief);
                
                // Load the associated project
                const foundProject = projectStore.getProject(convertedBrief.projectId);
                if (foundProject) {
                  setProject(foundProject);
                } else {
                  // Try to load the project from Supabase
                  const projectFromService = await projectService.getProjectById(convertedBrief.projectId);
                  if (projectFromService) {
                    setProject(projectFromService);
                  }
                }
                
                // Check if features exist for this brief
                const existingFeatureSet = featureStore.getFeatureSetByBriefId(convertedBrief.id);
                setFeatureSet(existingFeatureSet);
              } else {
                console.log("Brief not found in Supabase either, but continuing with PRD display");
                // We'll continue without the brief for viewing the PRD
              }
            } catch (briefError) {
              console.error("Error loading brief from service:", briefError);
              console.log("Continuing with PRD display despite brief loading error");
              // We'll continue without the brief for viewing the PRD
            }
          }
        } else {
          console.log("No PRD found with ID:", id);
          // If no PRD found, check if this is a brief ID
          const foundBrief = briefStore.getBrief(id as string);
          
          if (foundBrief) {
            console.log("Found brief with ID:", foundBrief);
            setBrief(foundBrief);
            setBriefRequired(true); // Brief is required when generating a new PRD
            // Show info content when generating a new PRD
            setShowInfoContent(true);
            
            const foundProject = projectStore.getProject(foundBrief.projectId);
            console.log("Found project:", foundProject);
            setProject(foundProject);
            
            // Check if features exist for this brief
            const existingFeatureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
            console.log("Found feature set:", existingFeatureSet);
            setFeatureSet(existingFeatureSet);
            
            // Check if a PRD exists for this brief
            const prds = await prdService.getPRDsByBriefId(foundBrief.id);
            console.log("Found PRDs for brief:", prds);
            if (prds && prds.length > 0) {
              console.log("Using first PRD:", prds[0]);
              setPRD(prds[0]);
              // If we found an existing PRD, don't show the info content
              setShowInfoContent(false);
            }
          } else {
            console.error("Neither PRD nor brief found with ID:", id);
            setError("PRD not found");
          }
        }
        
        // Mark data as loaded
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading PRD data:', error);
        setError('Failed to load PRD data: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsLoading(false);
      }
      
      // Check if mock data is being used
      setUsingMockData(isMockData());
    };
    
    loadData();
  }, [id]);

  const handleGeneratePRD = async () => {
    if (!brief || !featureSet) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Convert brief to the format expected by generatePRD
      const briefForGenerator = convertBriefForPRDGenerator(brief);
      
      const response = await generatePRD(briefForGenerator, featureSet);
      console.log("Generated PRD response:", response);
      
      const parsedPRD = parsePRD(response);
      console.log("Parsed PRD:", parsedPRD);
      
      // Create a new PRD object with all required fields
      const newPRD = {
        id: crypto.randomUUID(),
        briefId: brief.id,
        featureSetId: featureSet.id,
        title: brief.productName || 'Untitled PRD',
        overview: typeof brief.briefData?.proposedSolution === 'string' 
          ? brief.briefData.proposedSolution 
          : JSON.stringify(brief.briefData?.proposedSolution || ''),
        goals: typeof brief.briefData?.productObjectives === 'string' 
          ? brief.briefData.productObjectives 
          : JSON.stringify(brief.briefData?.productObjectives || ''),
        userFlows: '',
        requirements: '',
        constraints: '',
        timeline: '',
        content: parsedPRD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save the generated PRD using the PRD service
      try {
        const savedPRD = await prdService.savePRD(newPRD);
        console.log("Saved PRD:", savedPRD);
        setPRD(savedPRD);
        
        // Update session storage with new PRD
        setDataLoaded(true);
        saveStateToSession();
        
        // Redirect to the PRD page with the new PRD ID
        router.push(`/prd/${savedPRD.id}`);
      } catch (saveError) {
        console.error('Error saving PRD:', saveError);
        // If saving to the service fails, still set the PRD locally
        setPRD(newPRD);
        setError('PRD was generated but could not be saved to the server. You can still view it.');
      }
    } catch (err) {
      console.error('Error generating PRD:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePRD = async () => {
    if (!prd) return;
    setShowDeleteModal(true);
  };

  const confirmDeletePRD = async () => {
    if (!prd || !project) return;
    
      try {
      setIsDeleting(true);
        await prdService.deletePRD(prd.id);
      
      // Clear session storage for this PRD
      sessionStorage.removeItem(`prd_page_${id}`);
      
      setShowDeleteModal(false);
        router.push(`/project/${project.id}`);
      } catch (error) {
        console.error('Error deleting PRD:', error);
      setError('Failed to delete PRD: ' + (error instanceof Error ? error.message : String(error)));
      setIsDeleting(false);
    }
  };

  const cancelDeletePRD = () => {
    setShowDeleteModal(false);
  };

  // Add a function to handle downloading the PRD
  const handleDownloadPRD = () => {
    if (!prd) return;
    
    // Generate markdown content
    const markdownContent = prdToMarkdown(prd);
    
    // Create a sanitized filename
    const sanitizedName = prd.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `prd-${sanitizedName}.md`;
    
    // Download the file
    downloadAsFile(markdownContent, filename);
  };

  const handleContinue = () => {
    if (prd) {
      // Use window.location.href instead of router.push to ensure a full page reload
      // This helps avoid the 406 error when navigating to screens
      window.location.href = `/screens/${prd.id}`;
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
              <span>Loading PRD...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we're trying to generate a new PRD, we need the brief and feature set
  if (briefRequired && (!brief || !project)) {
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

  // If we're trying to generate a new PRD, we need the feature set
  if (briefRequired && !featureSet) {
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
              href={`/brief/${brief?.id || ''}/ideate`}
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              Go to Feature Ideation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If we have a PRD, show it regardless of whether we have the brief or not
  if (prd) {
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
                {project && (
                  <>
              <span>/</span>
              <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                {project.name}
              </Link>
                  </>
                )}
                {brief && (
                  <>
              <span>/</span>
              <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
                Brief
              </Link>
              <span>/</span>
              <Link href={`/brief/${brief.id}/ideate`} className="hover:text-[#111827] transition-colors">
                Features
              </Link>
                  </>
                )}
              <span>/</span>
              <span className="text-[#111827]">Requirements</span>
            </div>
            {usingMockData && <MockNotification stage="prd" />}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Product Requirements</h1>
                  <p className="text-[#6b7280] mt-2">
                    {brief ? `Detailed specifications for ${brief.productName}` : `Detailed product specifications`}
                  </p>
              </div>
              <div className="flex items-center space-x-3 self-start">
                    <Link
                      href={`/screens/${prd.id}`}
                      className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                    >
                      Continue
                    </Link>
                    <button
                      onClick={handleDownloadPRD}
                      className="inline-flex items-center justify-center bg-white text-[#6b7280] hover:text-[#111827] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15V3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={handleDeletePRD}
                      className="inline-flex items-center justify-center bg-white text-[#6b7280] hover:text-[#111827] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 grid-cols-1">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              )}
              <PRDViewer prd={prd} onUpdate={(updatedPRD) => {
                console.log("Updating PRD:", updatedPRD);
                setPRD(updatedPRD);
                prdService.savePRD(updatedPRD).catch(err => {
                  console.error("Error saving updated PRD:", err);
                  setError("Failed to save PRD updates: " + (err instanceof Error ? err.message : String(err)));
                });
              }} />
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5.00003C10.54 1.79003 13.46 1.79003 15.24 5.00003L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.995 17H12.005" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">Delete PRD</h3>
              <p className="text-center text-gray-600 mb-6">
                Are you sure you want to delete this PRD? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={cancelDeletePRD}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePRD}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete PRD'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If we don't have a PRD but we have a brief, show the PRD generation UI
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
            {project && (
              <>
                <span>/</span>
                <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                  {project.name}
                </Link>
              </>
            )}
            {brief && (
              <>
                <span>/</span>
                <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
                  Brief
                </Link>
                <span>/</span>
                <Link href={`/brief/${brief.id}/ideate`} className="hover:text-[#111827] transition-colors">
                  Features
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#111827]">Requirements</span>
          </div>
          {usingMockData && <MockNotification stage="prd" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Product Requirements</h1>
              <p className="text-[#6b7280] mt-2">Create detailed specifications for {brief?.productName || 'your product'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="space-y-8">
                {/* Only show informational content when showInfoContent is true */}
                {showInfoContent && (
                  <>
                    <div className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                      <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        What is a Product Requirements Document (PRD)?
                      </h3>
                      <p className="text-[#4b5563] mb-4 leading-relaxed">
                        A Product Requirements Document is a comprehensive guide that outlines everything needed to build your product successfully. It helps:
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4b5563]">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Development teams understand exactly what to build
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Stakeholders align on product functionality
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Project managers track progress effectively
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Designers create matching user interfaces
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                      <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 12H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12.5 15L15.5 12L12.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 6C2.75 7.67 2 9.75 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C10.57 2 9.2 2.3 7.97 2.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        What Will Be Generated?
                      </h3>
                      <p className="text-[#4b5563] mb-4">
                        Based on your product brief and prioritized features, we'll generate a detailed document that includes:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-[#4b5563]">
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#0F533A] rounded-full mr-2"></span>
                            Detailed feature specifications
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#0F533A] rounded-full mr-2"></span>
                            User stories and acceptance criteria
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#0F533A] rounded-full mr-2"></span>
                            Technical requirements
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#0F533A] rounded-full mr-2"></span>
                            Implementation guidelines
                          </li>
                        </ul>
                        
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
                          <p className="font-medium mb-2">Features Included</p>
                          <ul className="space-y-2">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                              All "Must Have" features
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                              All "Should Have" features
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <Link
                  href={`/brief/${brief?.id || ''}/ideate`}
                    className="inline-flex items-center justify-center bg-white text-[#0F533A] border border-[#0F533A] px-6 py-3 rounded-lg font-medium hover:bg-[#f8f9fa] transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Features
                  </Link>
                  <button
                    onClick={handleGeneratePRD}
                  disabled={isGenerating || !brief || !featureSet}
                  className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm ${(isGenerating || !brief || !featureSet) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
        </div>
      </div>
    </div>
  );
} 