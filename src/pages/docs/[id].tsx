import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import TechDocViewer from '../../components/TechDocViewer';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { PRD, prdStore } from '../../utils/prdStore';
import { techDocStore } from '../../utils/techDocStore';
import { generateTechDocumentation, parseTechDoc } from '../../utils/techDocGenerator';
import MockNotification from '../../components/MockNotification';
import { isMockData } from '../../utils/mockDetector';
import Modal from '../../components/Modal';
import { prdService } from '../../services/prdService';
import { briefService } from '../../services/briefService';
import { projectService } from '../../services/projectService';
import { techDocService, TechDoc } from '../../services/techDocService';

// Create a simple logger function since the actual logger module might not exist
const logger = {
  log: (message: string, data?: any) => {
    console.log(message, data);
  },
  error: (message: string, error?: any) => {
    console.error(message, error);
  }
};

// Helper function to convert local tech doc to Supabase format
const convertLocalTechDocToSupabase = (localTechDoc: any): Omit<TechDoc, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    prdId: localTechDoc.prdId,
    techStack: localTechDoc.techStack,
    frontend: localTechDoc.frontend,
    backend: localTechDoc.backend,
    content: localTechDoc.content
  };
};

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (id) {
        setIsLoading(true);
        logger.log('Loading data for ID:', id);
        
        try {
          // First, try to get the PRD from Supabase
          const supabasePRD = await prdService.getPRDById(id as string);
          
          if (supabasePRD) {
            logger.log('Found PRD in Supabase:', supabasePRD);
            setPRD(supabasePRD);
            
            // Try to get the brief from local storage first
            let foundBrief = briefStore.getBrief(supabasePRD.briefId);
            
            // If not in local storage, try to get it from Supabase
            if (!foundBrief && supabasePRD.briefId) {
              try {
                logger.log('Brief not found in local storage, checking Supabase');
                const supabaseBrief = await briefService.getBriefById(supabasePRD.briefId);
                
                if (supabaseBrief) {
                  logger.log('Found brief in Supabase:', supabaseBrief);
                  
                  // Create a brief object compatible with the local format
                  foundBrief = {
                    id: supabaseBrief.id,
                    projectId: supabaseBrief.project_id,
                    productName: supabaseBrief.product_name || '',
                    problemStatement: '',
                    targetUsers: '',
                    proposedSolution: '',
                    productObjectives: '',
                    content: JSON.stringify(supabaseBrief.brief_data || {}),
                    briefData: supabaseBrief.brief_data || {},
                    formData: supabaseBrief.form_data || {},
                    createdAt: supabaseBrief.created_at,
                    isEditing: false,
                    showEditButtons: false
                  } as Brief;
                  
                  // Save to local storage with the correct parameters
                  if (foundBrief.projectId && foundBrief.formData && foundBrief.content) {
                    briefStore.saveBrief(
                      foundBrief.projectId,
                      foundBrief.formData,
                      foundBrief.content
                    );
                  }
                } else {
                  logger.error('Brief not found in Supabase for PRD:', supabasePRD.briefId);
                }
              } catch (error) {
                logger.error('Error fetching brief from Supabase:', error);
              }
            }
            
            if (foundBrief) {
              logger.log('Setting brief:', foundBrief);
              setBrief(foundBrief);
              
              // Get the project from local storage first
              let foundProject = projectStore.getProject(foundBrief.projectId);
              
              // If not found in local storage, try to get it from Supabase
              if (!foundProject) {
                try {
                  logger.log('Project not found in local storage, checking Supabase for project ID:', foundBrief.projectId);
                  const supabaseProject = await projectService.getProjectById(foundBrief.projectId);
                  
                  if (supabaseProject) {
                    logger.log('Found project in Supabase:', supabaseProject);
                    foundProject = supabaseProject;
                    setProject(foundProject);
                  } else {
                    logger.error('Project not found in Supabase for brief:', foundBrief.projectId);
                  }
                } catch (error) {
                  logger.error('Error fetching project from Supabase:', error);
                }
              } else {
                setProject(foundProject);
              }
              
              // Check for existing tech doc
              const techDoc = await techDocService.getTechDocByPrdId(supabasePRD.id);
              if (techDoc) {
                setTechDoc(techDoc);
              } else {
                // Fallback to local storage if not found in Supabase
                const localTechDoc = techDocStore.getTechDocByPrdId(supabasePRD.id);
                if (localTechDoc) {
                  // Convert local tech doc to Supabase format and save it
                  const convertedTechDoc = convertLocalTechDocToSupabase(localTechDoc);
                  const savedTechDoc = await techDocService.saveTechDoc(convertedTechDoc);
                  setTechDoc(savedTechDoc);
                } else {
                  logger.log('No tech doc found, will need to generate one');
                }
              }
            } else {
              logger.error('No brief found for PRD:', supabasePRD.id);
            }
          } else {
            // If PRD not found in Supabase, check if the ID is a brief ID
            logger.log('PRD not found in Supabase, checking if ID is a brief ID');
            
            // Try to get the brief from local storage
            const briefFromLocalStorage = briefStore.getBrief(id as string);
            
            if (briefFromLocalStorage) {
              logger.log('Found brief in local storage:', briefFromLocalStorage);
              setBrief(briefFromLocalStorage);
              
              // Try to find the PRD associated with this brief
              const localPRD = prdStore.getPRDByBriefId(id as string);
              if (localPRD) {
                logger.log('Found PRD in local storage:', localPRD);
                setPRD(localPRD);
              } else {
                logger.error('No PRD found for brief ID:', id);
              }
              
              // Get the project from local storage first
              let foundProject = projectStore.getProject(briefFromLocalStorage.projectId);
              
              // If not found in local storage, try to get it from Supabase
              if (!foundProject) {
                try {
                  logger.log('Project not found in local storage, checking Supabase for project ID:', briefFromLocalStorage.projectId);
                  const supabaseProject = await projectService.getProjectById(briefFromLocalStorage.projectId);
                  
                  if (supabaseProject) {
                    logger.log('Found project in Supabase:', supabaseProject);
                    foundProject = supabaseProject;
                    setProject(foundProject);
                  } else {
                    logger.error('Project not found in Supabase for brief:', briefFromLocalStorage.projectId);
                  }
                } catch (error) {
                  logger.error('Error fetching project from Supabase:', error);
                }
              } else {
                setProject(foundProject);
              }
              
              // Check for existing tech doc
              if (localPRD) {
                const techDoc = await techDocService.getTechDocByPrdId(localPRD.id);
                if (techDoc) {
                  setTechDoc(techDoc);
                } else {
                  // Fallback to local storage if not found in Supabase
                  const localTechDoc = techDocStore.getTechDocByPrdId(localPRD.id);
                  if (localTechDoc) {
                    // Convert local tech doc to Supabase format and save it
                    const convertedTechDoc = convertLocalTechDocToSupabase(localTechDoc);
                    const savedTechDoc = await techDocService.saveTechDoc(convertedTechDoc);
                    setTechDoc(savedTechDoc);
                  }
                }
              }
            } else {
              // Try to get the brief from Supabase
              try {
                const supabaseBrief = await briefService.getBriefById(id as string);
                
                if (supabaseBrief) {
                  logger.log('Found brief in Supabase:', supabaseBrief);
                  
                  // Create a brief object compatible with the local format
                  const foundBrief = {
                    id: supabaseBrief.id,
                    projectId: supabaseBrief.project_id,
                    productName: supabaseBrief.product_name || '',
                    problemStatement: '',
                    targetUsers: '',
                    proposedSolution: '',
                    productObjectives: '',
                    content: JSON.stringify(supabaseBrief.brief_data || {}),
                    briefData: supabaseBrief.brief_data || {},
                    formData: supabaseBrief.form_data || {},
                    createdAt: supabaseBrief.created_at,
                    isEditing: false,
                    showEditButtons: false
                  } as Brief;
                  
                  setBrief(foundBrief);
                  
                  // Save to local storage with the correct parameters
                  if (foundBrief.projectId && foundBrief.formData && foundBrief.content) {
                    briefStore.saveBrief(
                      foundBrief.projectId,
                      foundBrief.formData,
                      foundBrief.content
                    );
                  }
                  
                  // Get the project from local storage first
                  let foundProject = projectStore.getProject(foundBrief.projectId);
                  
                  // If not found in local storage, try to get it from Supabase
                  if (!foundProject) {
                    try {
                      logger.log('Project not found in local storage, checking Supabase for project ID:', foundBrief.projectId);
                      const supabaseProject = await projectService.getProjectById(foundBrief.projectId);
                      
                      if (supabaseProject) {
                        logger.log('Found project in Supabase:', supabaseProject);
                        foundProject = supabaseProject;
                        setProject(foundProject);
                      } else {
                        logger.error('Project not found in Supabase for brief:', foundBrief.projectId);
                      }
                    } catch (error) {
                      logger.error('Error fetching project from Supabase:', error);
                    }
                  } else {
                    setProject(foundProject);
                  }
                } else {
                  logger.error('Brief not found in Supabase for ID:', id);
                  setError('Brief not found');
                }
              } catch (error) {
                logger.error('Error fetching brief from Supabase:', error);
                setError('Error fetching brief');
              }
            }
          }
        } catch (error) {
          logger.error('Error loading data:', error);
          setError('Error loading data');
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
  }, [id]);

  const handleGenerateTechDoc = async () => {
    if (!brief || !prd) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await generateTechDocumentation(brief, prd);
      const parsedTechDoc = parseTechDoc(response);
      
      // Save the generated tech doc to Supabase
      const techDocData = {
        prdId: prd.id,
        techStack: parsedTechDoc.techStack,
        frontend: parsedTechDoc.frontend,
        backend: parsedTechDoc.backend,
        content: parsedTechDoc.content
      };
      
      const savedTechDoc = await techDocService.saveTechDoc(techDocData);
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
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!techDoc) return;
    
    try {
      const deleted = await techDocService.deleteTechDoc(techDoc.id);
      if (deleted) {
        setTechDoc(null);
      }
    } catch (error) {
      console.error('Error deleting tech doc:', error);
      // Fallback to local storage
      const localDeleted = techDocStore.deleteTechDoc(techDoc.id);
      if (localDeleted) {
        setTechDoc(null);
      }
    }
    
    setShowDeleteModal(false);
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
            <Link href={`/screens/${prd.id}`} className="hover:text-[#111827] transition-colors">
              App Screens
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
              {techDoc && project && (
                <Link
                  href={`/implementation/${project.id}`}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
                >
                  Implementation Guide
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
              {techDoc && (
                <button
                  onClick={handleDeleteTechDoc}
                  className="inline-flex items-center justify-center bg-white text-[#6b7280] hover:text-[#111827] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          {!techDoc ? (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#0F533A]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    What is Technical Documentation?
                  </h3>
                  <p className="text-[#4b5563] mb-4 leading-relaxed">
                    Technical documentation provides comprehensive guidance for your development team, ensuring consistent implementation and maintainable code.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4b5563]">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Standardize development practices
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Ensure consistent implementation
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Guide architectural decisions
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Maintain code quality standards
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#0F533A]/5 to-transparent rounded-xl p-6">
                  <h4 className="text-sm font-medium text-[#0F533A] mb-3">Documentation Sections</h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                      <h5 className="text-sm font-medium text-[#111827] mb-2">Platform & Architecture</h5>
                      <ul className="space-y-2 text-sm text-[#4b5563]">
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          Platform specifications (Web, Mobile, Desktop)
                        </li>
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          System architecture and components
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                      <h5 className="text-sm font-medium text-[#111827] mb-2">Frontend Development</h5>
                      <ul className="space-y-2 text-sm text-[#4b5563]">
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          UI framework and component library
                        </li>
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          Design system and style guidelines
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                      <h5 className="text-sm font-medium text-[#111827] mb-2">Backend Infrastructure</h5>
                      <ul className="space-y-2 text-sm text-[#4b5563]">
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          API architecture and endpoints
                        </li>
                        <li className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0F533A] mr-2"></div>
                          Database schema and relationships
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateTechDoc}
                    disabled={isGenerating}
                    className={`inline-flex items-center justify-center bg-[#0F533A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0a3f2c] transition-all duration-200 shadow-sm ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Documentation...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Technical Documentation"
      >
        <div className="p-6">
          <p className="text-[#4b5563] mb-6">
            Are you sure you want to delete this technical documentation? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#111827] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Documentation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
