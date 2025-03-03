import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import MockNotification from '../../components/MockNotification';
import { Project, projectService } from '../../services/projectService';
import { Brief, briefService } from '../../services/briefService';
import { featureStore } from '../../utils/featureStore';
import { GeneratedBrief } from '../../utils/briefGenerator';
import { isMockData } from '../../utils/mockDetector';
import { generatePRD, parsePRD } from '../../utils/prdGenerator';
import { prdStore } from '../../utils/prdStore';
import { featureService } from '../../services/featureService';
import { prdService } from '../../services/prdService';
import { briefToMarkdown, downloadAsFile } from '../../utils/downloadUtils';

// Helper function to safely render potentially stringified JSON
function RenderField({ 
  content, 
  isEditing, 
  fieldName, 
  onChange 
}: { 
  content: string; 
  isEditing: boolean; 
  fieldName: keyof GeneratedBrief; 
  onChange: (fieldName: keyof GeneratedBrief, value: string) => void;
}) {
  if (isEditing) {
    return (
      <textarea
        className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#0F533A] focus:border-transparent"
        value={content}
        onChange={(e) => onChange(fieldName, e.target.value)}
        rows={content.split('\n').length + 1}
      />
    );
  }

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

export default function BriefDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBriefData, setEditedBriefData] = useState<GeneratedBrief | null>(null);
  const [hasFeatures, setHasFeatures] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditButtons, setShowEditButtons] = useState(false);

  useEffect(() => {
    const fetchBriefAndProject = async () => {
      if (!id) return;
      
      try {
        // Fetch brief from Supabase
        const foundBrief = await briefService.getBriefById(id as string);
        
        if (foundBrief) {
          setBrief(foundBrief);
          
          // Fetch project from Supabase
          const foundProject = await projectService.getProjectById(foundBrief.project_id);
          setProject(foundProject);
          
          // Check for features (still using local storage for now)
          setHasFeatures(!!featureStore.getFeatureSetByBriefId(foundBrief.id));
          
          // Initialize states from brief properties
          setIsEditing(foundBrief.is_editing || false);
          setShowEditButtons(foundBrief.show_edit_buttons || false);
          setEditedBriefData(foundBrief.brief_data);
        }
      } catch (error) {
        console.error('Error fetching brief or project:', error);
        setError('Failed to load brief. Please try again.');
      } finally {
        setIsLoading(false);
        setUsingMockData(isMockData());
      }
    };
    
    fetchBriefAndProject();
  }, [id]);

  const handleFieldChange = (fieldName: keyof GeneratedBrief, value: string) => {
    if (editedBriefData) {
      setEditedBriefData({
        ...editedBriefData,
        [fieldName]: value
      });
    }
  };

  const handleSave = async () => {
    if (!brief || !editedBriefData) return;
    
    setIsSaving(true);
    
    try {
      // Update brief in Supabase
      const updatedBrief = await briefService.updateBrief(
        brief.id, 
        editedBriefData, 
        false, 
        false
      );
      
      setBrief(updatedBrief);
      setIsEditing(false);
      setEditedBriefData(updatedBrief.brief_data);
    } catch (error) {
      console.error('Error saving brief:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePRD = async () => {
    if (!brief) return;
    
    setIsGeneratingPRD(true);
    setError(null);
    
    try {
      // Get the feature set for this brief from Supabase
      const featureSet = await featureService.getFeatureSetByBriefId(brief.id);
      if (!featureSet) {
        throw new Error('Please generate features before creating a PRD');
      }

      // Generate the PRD
      const prdContent = await generatePRD(brief, featureSet);
      const parsedPRD = parsePRD(prdContent);
      
      // Create a new PRD object
      const newPRD = {
        id: crypto.randomUUID(),
        briefId: brief.id,
        featureSetId: featureSet.id,
        title: brief.product_name || 'Untitled PRD',
        content: parsedPRD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save the PRD using the PRD service
      const savedPRD = await prdService.savePRD(newPRD);
      
      // Navigate to the PRD page
      router.push(`/prd/${savedPRD.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PRD. Please try again.');
    } finally {
      setIsGeneratingPRD(false);
    }
  };

  const handleEditClick = async () => {
    if (!brief) return;
    
    setShowEditButtons(true);
    setIsEditing(true);
    setEditedBriefData(brief.brief_data);
    
    try {
      // Update brief in Supabase to persist editing state
      await briefService.updateBrief(
        brief.id, 
        brief.brief_data, 
        true, 
        true
      );
    } catch (error) {
      console.error('Error updating brief edit state:', error);
      setError('Failed to enter edit mode. Please try again.');
    }
  };

  const handleCancelEdit = async () => {
    if (!brief) return;
    
    setShowEditButtons(false);
    setIsEditing(false);
    setEditedBriefData(brief.brief_data);
    
    try {
      // Update brief in Supabase to persist non-editing state
      await briefService.updateBrief(
        brief.id, 
        brief.brief_data, 
        false, 
        false
      );
    } catch (error) {
      console.error('Error updating brief edit state:', error);
      setError('Failed to cancel edit mode. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!brief || !editedBriefData) return;
    
    setIsSaving(true);
    
    try {
      // Update brief in Supabase with editing mode disabled
      const updatedBrief = await briefService.updateBrief(
        brief.id, 
        editedBriefData, 
        false, 
        false
      );
      
      setBrief(updatedBrief);
      setShowEditButtons(false);
      setIsEditing(false);
      setEditedBriefData(updatedBrief.brief_data);
    } catch (error) {
      console.error('Error saving brief changes:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to handle downloading the brief
  const handleDownloadBrief = () => {
    if (!brief || !project) return;
    
    // Generate markdown content
    const markdownContent = briefToMarkdown(brief.brief_data, brief.product_name || 'Product Brief');
    
    // Create a sanitized filename
    const sanitizedName = brief.product_name?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'product-brief';
    const filename = `brief-${sanitizedName}.md`;
    
    // Download the file
    downloadAsFile(markdownContent, filename);
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

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280]">
              <Link href="/projects" className="hover:text-[#111827] transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/project/${project?.id}`} className="hover:text-[#111827] transition-colors">
                {project?.name}
              </Link>
              <span>/</span>
              <span className="text-[#111827]">Brief</span>
            </div>
            
            <div className="flex space-x-4">
              {showEditButtons ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0F533A] rounded-lg hover:bg-[#0a3f2c] transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDownloadBrief}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15V3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/brief/${brief?.id}/ideate`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#0F533A] rounded-lg hover:bg-[#0a3f2c] transition-colors"
                  >
                    Continue
                  </Link>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {usingMockData && <MockNotification stage="brief" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Product Brief</h1>
              <p className="text-[#6b7280] mt-2">{brief.product_name}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
                <h2 className="text-xl font-semibold text-[#111827]">Product Brief</h2>
              </div>
              <div className="bg-[#e6f0eb] text-[#0F533A] text-sm px-3 py-1 rounded-full font-medium">
                Completed
              </div>
            </div>
            
            <div className="space-y-8 mt-6">
              {/* Executive Summary */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Executive Summary</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.executiveSummary || brief.brief_data.executiveSummary} 
                  isEditing={isEditing}
                  fieldName="executiveSummary"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Problem Statement */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Problem Statement</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.problemStatement || brief.brief_data.problemStatement} 
                  isEditing={isEditing}
                  fieldName="problemStatement"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Target Users */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Target Users</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.targetUsers || brief.brief_data.targetUsers} 
                  isEditing={isEditing}
                  fieldName="targetUsers"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Existing Solutions */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Existing Solutions</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.existingSolutions || brief.brief_data.existingSolutions} 
                  isEditing={isEditing}
                  fieldName="existingSolutions"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Proposed Solution */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Proposed Solution</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.proposedSolution || brief.brief_data.proposedSolution} 
                  isEditing={isEditing}
                  fieldName="proposedSolution"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Product Objectives */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Product Objectives</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.productObjectives || brief.brief_data.productObjectives} 
                  isEditing={isEditing}
                  fieldName="productObjectives"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Key Features */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#111827]">Key Features</h3>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <RenderField 
                  content={editedBriefData?.keyFeatures || brief.brief_data.keyFeatures} 
                  isEditing={isEditing}
                  fieldName="keyFeatures"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Market Analysis */}
              {(brief.brief_data.marketAnalysis || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-[#111827]">Market Analysis</h3>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <RenderField 
                    content={editedBriefData?.marketAnalysis || brief.brief_data.marketAnalysis || ''} 
                    isEditing={isEditing}
                    fieldName="marketAnalysis"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Technical Risks */}
              {(brief.brief_data.technicalRisks || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-[#111827]">Technical Risks</h3>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <RenderField 
                    content={editedBriefData?.technicalRisks || brief.brief_data.technicalRisks || ''} 
                    isEditing={isEditing}
                    fieldName="technicalRisks"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Business Risks */}
              {(brief.brief_data.businessRisks || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-[#111827]">Business Risks</h3>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <RenderField 
                    content={editedBriefData?.businessRisks || brief.brief_data.businessRisks || ''} 
                    isEditing={isEditing}
                    fieldName="businessRisks"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Implementation Strategy */}
              {(brief.brief_data.implementationStrategy || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-[#111827]">Implementation Strategy</h3>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <RenderField 
                    content={editedBriefData?.implementationStrategy || brief.brief_data.implementationStrategy || ''} 
                    isEditing={isEditing}
                    fieldName="implementationStrategy"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Success Metrics */}
              {(brief.brief_data.successMetrics || isEditing) && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-[#111827]">Success Metrics</h3>
                    {!isEditing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <RenderField 
                    content={editedBriefData?.successMetrics || brief.brief_data.successMetrics || ''} 
                    isEditing={isEditing}
                    fieldName="successMetrics"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 