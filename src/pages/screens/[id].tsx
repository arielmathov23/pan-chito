import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { ScreenSet, screenStore, Screen as ScreenType } from '../../utils/screenStore';
import { generateScreens } from '../../utils/screenGenerator';
import MockNotification from '../../components/MockNotification';
import { isMockData } from '../../utils/mockDetector';
import { v4 as uuidv4 } from 'uuid';
import { AppFlow, FlowStep } from '../../utils/screenStore';
import Modal from '../../components/Modal';
import briefService from '../../services/briefService';
import screenService from '../../services/screenService';

export default function ScreensPage() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [prd, setPRD] = useState<PRD | null>(null);
  const [screenSet, setScreenSet] = useState<ScreenSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [stepDescription, setStepDescription] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState<string | undefined>();

  useEffect(() => {
    setUsingMockData(isMockData());
    
    if (id) {
      console.log(`Screens page: Loading data for ID: ${id}`);
      
      // First, try to find a PRD with this ID
      const foundPRD = prdStore.getPRD(id as string);
      console.log(`Screens page: PRD lookup result:`, foundPRD);
      
      if (foundPRD) {
        // If we found a PRD, use it
        console.log(`Screens page: Using PRD with ID: ${foundPRD.id}`);
        setPRD(foundPRD);
        
        // Get the brief using the briefId from the PRD
        const foundBrief = briefStore.getBrief(foundPRD.briefId);
        console.log(`Screens page: Brief lookup result for briefId ${foundPRD.briefId}:`, foundBrief);
        
        if (foundBrief) {
          setBrief(foundBrief);
          const foundProject = projectStore.getProject(foundBrief.projectId);
          console.log(`Screens page: Project lookup result:`, foundProject);
          setProject(foundProject);
        } else {
          console.error(`Screens page: Brief not found for briefId: ${foundPRD.briefId}`);
          // Try to load the brief directly from local storage as a fallback
          const allBriefs = briefStore.getBriefs();
          console.log(`Screens page: Checking all briefs:`, allBriefs);
          const matchingBrief = allBriefs.find(b => b.id === foundPRD.briefId);
          
          if (matchingBrief) {
            console.log(`Screens page: Found matching brief in all briefs:`, matchingBrief);
            setBrief(matchingBrief);
            const foundProject = projectStore.getProject(matchingBrief.projectId);
            setProject(foundProject);
          } else {
            // If not found in localStorage, try to fetch from Supabase
            console.log(`Screens page: Brief not found in localStorage, trying to fetch from Supabase`);
            
            // Use an IIFE to allow async/await in useEffect
            (async () => {
              try {
                const supabaseBrief = await briefService.fetchBriefFromSupabase(foundPRD.briefId);
                
                if (supabaseBrief) {
                  console.log(`Screens page: Brief found in Supabase:`, supabaseBrief);
                  
                  // Convert Supabase brief to local format
                  const localBrief: Brief = {
                    id: supabaseBrief.id,
                    projectId: supabaseBrief.project_id,
                    productName: supabaseBrief.product_name,
                    problemStatement: supabaseBrief.brief_data?.problemStatement || '',
                    targetUsers: supabaseBrief.brief_data?.targetUsers || '',
                    proposedSolution: supabaseBrief.brief_data?.proposedSolution || '',
                    productObjectives: supabaseBrief.brief_data?.productObjectives || '',
                    createdAt: supabaseBrief.created_at,
                    content: JSON.stringify(supabaseBrief.brief_data),
                    briefData: supabaseBrief.brief_data,
                    formData: supabaseBrief.form_data,
                    isEditing: false,
                    showEditButtons: false
                  };
                  
                  setBrief(localBrief);
                  
                  // Also save to localStorage for future use
                  briefStore.updateBrief(localBrief.id, localBrief.briefData);
                  
                  const foundProject = projectStore.getProject(localBrief.projectId);
                  setProject(foundProject);
                } else {
                  console.error(`Screens page: Brief not found in Supabase for briefId: ${foundPRD.briefId}`);
                  setError("Brief not found. Please ensure you have created a brief before accessing this page.");
                }
              } catch (error) {
                console.error(`Screens page: Error fetching brief from Supabase:`, error);
                setError("Error loading brief. Please try again later.");
              }
            })();
          }
        }
        
        // Load screen set from Supabase
        (async () => {
          try {
            console.log(`Screens page: Loading screen set for PRD ID: ${foundPRD.id}`);
            const supabaseScreenSet = await screenService.getScreenSetByPrdId(foundPRD.id);
            
            if (supabaseScreenSet) {
              console.log(`Screens page: Screen set found in Supabase:`, supabaseScreenSet);
              setScreenSet(supabaseScreenSet);
            } else {
              // If not found in Supabase, try local storage
              console.log(`Screens page: Screen set not found in Supabase, checking local storage`);
              const localScreenSet = screenStore.getScreenSetByPrdId(foundPRD.id);
              
              if (localScreenSet) {
                console.log(`Screens page: Screen set found in local storage:`, localScreenSet);
                setScreenSet(localScreenSet);
                
                // Save to Supabase for future use
                try {
                  await screenService.saveScreenSet(
                    foundPRD.id, 
                    localScreenSet.screens, 
                    localScreenSet.appFlow
                  );
                  console.log(`Screens page: Local screen set saved to Supabase`);
                } catch (saveError) {
                  console.error(`Screens page: Error saving local screen set to Supabase:`, saveError);
                }
              } else {
                console.log(`Screens page: No screen set found for PRD ID: ${foundPRD.id}`);
              }
            }
          } catch (error) {
            console.error(`Screens page: Error loading screen set:`, error);
          }
        })();
      } else {
        console.error(`Screens page: Neither PRD nor brief found with ID: ${id}`);
        setError("PRD not found. Please ensure you have created a PRD before accessing this page.");
      }
      
      setIsLoading(false);
    }
  }, [id]);

  const handleGenerateScreens = async () => {
    console.log("handleGenerateScreens called");
    console.log("brief:", brief);
    console.log("prd:", prd);
    
    if (!brief || !prd) {
      console.error("Cannot generate screens: brief or prd is missing");
      
      if (!brief && prd) {
        console.log("Attempting to fetch brief again for briefId:", prd.briefId);
        
        // First try to get from localStorage
        const foundBrief = briefStore.getBrief(prd.briefId);
        
        if (foundBrief) {
          console.log("Successfully retrieved brief from localStorage:", foundBrief);
          setBrief(foundBrief);
          // Continue with screen generation after setting the brief
          setTimeout(() => handleGenerateScreens(), 100);
          return;
        } else {
          // If not in localStorage, try to fetch from Supabase
          console.log("Brief not found in localStorage, trying to fetch from Supabase");
          try {
            const supabaseBrief = await briefService.fetchBriefFromSupabase(prd.briefId);
            
            if (supabaseBrief) {
              console.log("Successfully retrieved brief from Supabase:", supabaseBrief);
              
              // Convert Supabase brief to local format if needed
              const localBrief: Brief = {
                id: supabaseBrief.id,
                projectId: supabaseBrief.project_id,
                productName: supabaseBrief.product_name,
                problemStatement: supabaseBrief.brief_data?.problemStatement || '',
                targetUsers: supabaseBrief.brief_data?.targetUsers || '',
                proposedSolution: supabaseBrief.brief_data?.proposedSolution || '',
                productObjectives: supabaseBrief.brief_data?.productObjectives || '',
                createdAt: supabaseBrief.created_at,
                content: JSON.stringify(supabaseBrief.brief_data),
                briefData: supabaseBrief.brief_data,
                formData: supabaseBrief.form_data,
                isEditing: false,
                showEditButtons: false
              };
              
              // Save to localStorage for future use
              briefStore.updateBrief(localBrief.id, localBrief.briefData);
              
              // Set the brief in state
              setBrief(localBrief);
              
              // Continue with screen generation after setting the brief
              setTimeout(() => handleGenerateScreens(), 100);
              return;
            } else {
              setError("Brief not found in database. Please ensure the brief exists before generating screens.");
              return;
            }
          } catch (error) {
            console.error("Error fetching brief from Supabase:", error);
            setError("Error fetching brief from database. Please try again later.");
            return;
          }
        }
      }
      
      return;
    }
    
    // Check if we're in development mode and need to warn about API key
    if (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.warn("OpenAI API key might be missing. Make sure OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY is set in .env.local");
      setError("OpenAI API key might be missing. Check the console for more information.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    console.log("Starting screen generation...");
    
    try {
      console.log("Calling generateScreens with brief and prd");
      const { screens, appFlow } = await generateScreens(brief, prd);
      console.log("Screen generation successful:", { screens, appFlow });
      
      // Save the generated screens to Supabase
      console.log("Saving screen set to Supabase");
      const savedScreenSet = await screenService.saveScreenSet(prd.id, screens, appFlow);
      console.log("Screen set saved to Supabase:", savedScreenSet);
      
      // Also save to local store for backward compatibility
      screenStore.saveScreenSet(prd.id, screens, appFlow);
      
      setScreenSet(savedScreenSet);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating screens:", error);
      setError("Failed to generate screens. Please try again later.");
      setIsGenerating(false);
    }
  };

  const handleDeleteScreens = async () => {
    if (!screenSet || !prd) return;
    
    if (window.confirm(`Are you sure you want to delete these screens?\n\nThis action cannot be undone.`)) {
      try {
        // Delete from Supabase
        await screenService.deleteScreenSet(screenSet.appFlow.id);
        
        // Also delete from local storage for backward compatibility
        screenStore.deleteScreenSet(screenSet.appFlow.id);
        
        setScreenSet(null);
      } catch (error) {
        console.error('Error deleting screens:', error);
        setError('Failed to delete screens. Please try again.');
      }
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setStepDescription('');
    setSelectedScreenId(undefined);
    setIsModalOpen(true);
  };

  const handleEditStep = (step: FlowStep) => {
    setEditingStep(step);
    setIsStepModalOpen(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setStepToDelete(stepId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStep = async () => {
    if (stepToDelete && screenSet && screenSet.appFlow) {
      const updatedSteps = screenSet.appFlow.steps.filter(step => step.id !== stepToDelete);
      const updatedAppFlow = { ...screenSet.appFlow, steps: updatedSteps };
      
      try {
        // Update in Supabase
        await screenService.updateAppFlow(updatedAppFlow);
        
        // Also update in local store for backward compatibility
        screenStore.updateAppFlow(updatedAppFlow);
        
        setScreenSet({
          ...screenSet,
          appFlow: updatedAppFlow
        });
      } catch (error) {
        console.error('Error deleting step:', error);
        setError('Failed to delete step. Please try again.');
      }
      
      setIsDeleteModalOpen(false);
      setStepToDelete(null);
    }
  };

  const handleSaveStep = async (stepData: { description: string; screenId?: string }) => {
    if (!screenSet) return;

    try {
      let updatedSteps;
      if (editingStep) {
        // Update existing step
        updatedSteps = screenSet.appFlow.steps.map(step =>
          step.id === editingStep.id
            ? { ...step, ...stepData }
            : step
        );
      } else {
        // Add new step
        const newStep = {
          id: uuidv4(),
          ...stepData
        };
        updatedSteps = [...screenSet.appFlow.steps, newStep];
      }

      const updatedAppFlow = { ...screenSet.appFlow, steps: updatedSteps };
      
      // Update in Supabase
      await screenService.updateAppFlow(updatedAppFlow);
      
      // Also update in local store for backward compatibility
      screenStore.updateAppFlow(updatedAppFlow);
      
      // Update the screenSet state
      setScreenSet({
        ...screenSet,
        appFlow: updatedAppFlow
      });

      setIsStepModalOpen(false);
      setEditingStep(null);
    } catch (error) {
      console.error('Error saving step:', error);
      setError('Failed to save step. Please try again.');
    }
  };

  const renderScreen = (screen: ScreenType) => {
    // Group elements by type
    const elements = {
      images: screen.elements.filter(e => e.type === 'image'),
      inputs: screen.elements.filter(e => e.type === 'input'),
      text: screen.elements.filter(e => e.type === 'text'),
      buttons: screen.elements.filter(e => e.type === 'button')
    };

    return (
      <div key={screen.id} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#0F533A]/5 to-transparent px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-lg font-medium text-[#111827]">{screen.name}</h3>
          <p className="text-[#6b7280] mt-1">{screen.description}</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Images Section */}
          {elements.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151]">Images</h4>
              {elements.images.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4">
                  <p className="text-[#4b5563] text-sm">{element.properties.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Inputs Section */}
          {elements.inputs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151]">Input Fields</h4>
              {elements.inputs.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4">
                  <p className="text-[#4b5563] text-sm">{element.properties.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Information Section */}
          {elements.text.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151]">Information</h4>
              {elements.text.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4">
                  <p className="text-[#4b5563] text-sm">{element.properties.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Section */}
          {elements.buttons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#374151]">Navigation</h4>
              {elements.buttons.map(element => (
                <div key={element.id} className="bg-[#f8f9fa] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4b5563] text-sm font-medium">{element.properties.content}</span>
                    {element.properties.action && (
                      <span className="text-[#0F533A] text-sm">→ {element.properties.action}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A] mx-auto mb-4"></div>
          <p className="text-[#4b5563]">Loading screens...</p>
        </div>
      </div>
    );
  }

  if (error || !prd) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Navbar />
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 text-center">
            <svg className="w-16 h-16 text-[#f87171] mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">PRD Not Found</h2>
            <p className="text-[#4b5563] mb-6">
              {error || "We couldn't find the PRD you're looking for. It may have been deleted or the ID is incorrect."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center bg-white border border-[#d1d5db] text-[#111827] px-5 py-2.5 rounded-lg font-medium hover:bg-[#f3f4f6] transition-colors"
              >
                Go to projects
              </Link>
              {brief && (
                <Link
                  href={`/prd/${brief.id}`}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                >
                  Go to PRD generation
                </Link>
              )}
            </div>
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
            {project && (
              <>
                <Link href={`/project/${project.id}`} className="hover:text-[#111827] transition-colors">
                  {project.name}
                </Link>
                <span>/</span>
              </>
            )}
            {brief && (
              <>
                <Link href={`/brief/${brief.id}`} className="hover:text-[#111827] transition-colors">
                  Brief
                </Link>
                <span>/</span>
              </>
            )}
            <Link href={`/prd/${prd.id}`} className="hover:text-[#111827] transition-colors">
              PRD
            </Link>
            <span>/</span>
            <span className="text-[#111827]">Screens</span>
          </div>
          
          {usingMockData && <MockNotification stage="screens" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">App Screens</h1>
              <p className="text-[#6b7280] mt-2">Screen designs and app flow for {brief ? brief.productName : 'your product'}</p>
            </div>
            <div className="flex items-center space-x-3 self-start">
              {screenSet && (
                <>
                  <Link
                    href={`/docs/${prd.id}`}
                    className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                  >
                    Continue
                  </Link>
                  <button
                    onClick={handleDeleteScreens}
                    className="inline-flex items-center justify-center bg-white text-[#6b7280] hover:text-[#111827] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {!screenSet ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 11H16" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 16H12" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    What are App Screens?
                  </h3>
                  <p className="text-[#4b5563] mb-4 leading-relaxed">
                    App screens are visual representations of your application's interface. They help:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4b5563]">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Visualize user interface and flow
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Define navigation and interactions
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Guide development and design teams
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Validate user experience early
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#0F533A]/5 to-transparent rounded-xl p-6">
                  <h4 className="text-sm font-medium text-[#0F533A] mb-3">What Will Be Generated?</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Complete user flow with step-by-step navigation</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Essential screens based on your PRD features</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                      <span className="text-[#4b5563]">Core functionality screens (auth, dashboard, etc.)</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleGenerateScreens}
                    disabled={isGenerating}
                    className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                        Generate Screens
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* App Flow Section */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                    <h2 className="text-xl font-semibold text-[#111827]">User Journey</h2>
                  </div>
                  <button
                    onClick={handleAddStep}
                    className="inline-flex items-center justify-center bg-[#0F533A]/10 text-[#0F533A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F533A]/20 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Add Step
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#0F533A]/10"></div>
                    <div className="space-y-6">
                      {screenSet.appFlow.steps.map((step, index) => (
                        <div key={step.id} className="relative flex items-start group">
                          <div className="absolute -left-2 flex items-center justify-center w-20 h-full">
                            <div className="w-4 h-4 rounded-full bg-[#0F533A] flex items-center justify-center text-white text-xs">
                              {index + 1}
                            </div>
                          </div>
                          <div className="ml-12 flex-grow">
                            <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 group-hover:border-[#0F533A]/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                  <p className="text-[#111827] font-medium">{step.description}</p>
                                  {step.screenId && (
                                    <div className="mt-2 flex items-center">
                                      <svg className="w-4 h-4 text-[#0F533A] mr-1.5" viewBox="0 0 24 24" fill="none">
                                        <path d="M10 16L14 12L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="text-sm text-[#0F533A]">
                                        Goes to: {screenSet.screens.find(s => s.id === step.screenId)?.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleEditStep(step)}
                                    className="p-1 hover:bg-[#f3f4f6] rounded text-[#6b7280] hover:text-[#111827] transition-colors"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M21.5 2.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M15 2H22V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="p-1 hover:bg-red-50 rounded text-[#6b7280] hover:text-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                      <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Screens Section */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                    <h2 className="text-xl font-semibold text-[#111827]">App Screens</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {screenSet.screens.map(screen => renderScreen(screen))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Step Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStep ? "Edit Journey Step" : "Add Journey Step"}
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                rows={3}
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                placeholder="Describe what happens in this step..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Screen
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#0F533A] focus:border-[#0F533A]"
                value={selectedScreenId || ''}
                onChange={(e) => setSelectedScreenId(e.target.value || undefined)}
              >
                <option value="">Select a screen</option>
                {screenSet?.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveStep({ description: stepDescription, screenId: selectedScreenId })}
                className="px-4 py-2 text-sm bg-[#0F533A] text-white rounded-md hover:bg-[#0a3f2c]"
              >
                Save Step
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Step"
        >
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this step? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStep}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
} 