import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import MockNotification from '../../components/MockNotification';
import { Project, projectStore } from '../../utils/projectStore';
import { Brief, briefStore } from '../../utils/briefStore';
import { featureStore } from '../../utils/featureStore';
import { GeneratedBrief } from '../../utils/briefGenerator';
import isMockData from '../../utils/mockDetector';

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

  useEffect(() => {
    if (id) {
      const foundBrief = briefStore.getBrief(id as string);
      setBrief(foundBrief);
      
      if (foundBrief) {
        const foundProject = projectStore.getProject(foundBrief.projectId);
        setProject(foundProject);
        
        // Check if features exist for this brief
        const featureSet = featureStore.getFeatureSetByBriefId(foundBrief.id);
        setHasFeatures(!!featureSet && featureSet.features.length > 0);
        
        // Initialize edited brief data
        setEditedBriefData(foundBrief.briefData);
      }
      
      setIsLoading(false);
      
      // Check if mock data is being used
      setUsingMockData(isMockData());
    }
  }, [id]);

  const handleFieldChange = (fieldName: keyof GeneratedBrief, value: string) => {
    if (editedBriefData) {
      setEditedBriefData({
        ...editedBriefData,
        [fieldName]: value
      });
    }
  };

  const handleSave = () => {
    if (!brief || !editedBriefData) return;
    
    setIsSaving(true);
    
    try {
      const updatedBrief = briefStore.updateBrief(brief.id, editedBriefData);
      if (updatedBrief) {
        setBrief(updatedBrief);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving brief:', error);
    } finally {
      setIsSaving(false);
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
            <span className="text-[#111827]">Brief</span>
          </div>

          {usingMockData && <MockNotification stage="brief" />}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] tracking-tight">{brief.productName}</h1>
              <div className="text-xs text-[#6b7280] mt-3 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              Created {new Date(brief.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedBriefData(brief.briefData);
                  }}
                  className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg font-medium hover:bg-[#f0f2f5] transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg font-medium hover:bg-[#f0f2f5] transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.91 4.15C15.58 6.54 17.45 8.41 19.85 9.09" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Brief
              </button>
            )}
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
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Executive Summary</h3>
                <RenderField 
                  content={editedBriefData?.executiveSummary || brief.briefData.executiveSummary} 
                  isEditing={isEditing}
                  fieldName="executiveSummary"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Problem Statement */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Problem Statement</h3>
                <RenderField 
                  content={editedBriefData?.problemStatement || brief.briefData.problemStatement} 
                  isEditing={isEditing}
                  fieldName="problemStatement"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Target Users */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Target Users</h3>
                <RenderField 
                  content={editedBriefData?.targetUsers || brief.briefData.targetUsers} 
                  isEditing={isEditing}
                  fieldName="targetUsers"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Existing Solutions */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Existing Solutions</h3>
                <RenderField 
                  content={editedBriefData?.existingSolutions || brief.briefData.existingSolutions} 
                  isEditing={isEditing}
                  fieldName="existingSolutions"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Proposed Solution */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Proposed Solution</h3>
                <RenderField 
                  content={editedBriefData?.proposedSolution || brief.briefData.proposedSolution} 
                  isEditing={isEditing}
                  fieldName="proposedSolution"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Product Objectives */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Product Objectives</h3>
                <RenderField 
                  content={editedBriefData?.productObjectives || brief.briefData.productObjectives} 
                  isEditing={isEditing}
                  fieldName="productObjectives"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Key Features */}
              <div className="border-b border-[#e5e7eb] pb-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-3">Key Features</h3>
                <RenderField 
                  content={editedBriefData?.keyFeatures || brief.briefData.keyFeatures} 
                  isEditing={isEditing}
                  fieldName="keyFeatures"
                  onChange={handleFieldChange}
                />
              </div>
              
              {/* Market Analysis */}
              {(brief.briefData.marketAnalysis || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Market Analysis</h3>
                  <RenderField 
                    content={editedBriefData?.marketAnalysis || brief.briefData.marketAnalysis || ''} 
                    isEditing={isEditing}
                    fieldName="marketAnalysis"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Technical Risks */}
              {(brief.briefData.technicalRisks || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Technical Risks</h3>
                  <RenderField 
                    content={editedBriefData?.technicalRisks || brief.briefData.technicalRisks || ''} 
                    isEditing={isEditing}
                    fieldName="technicalRisks"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Business Risks */}
              {(brief.briefData.businessRisks || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Business Risks</h3>
                  <RenderField 
                    content={editedBriefData?.businessRisks || brief.briefData.businessRisks || ''} 
                    isEditing={isEditing}
                    fieldName="businessRisks"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Implementation Strategy */}
              {(brief.briefData.implementationStrategy || isEditing) && (
                <div className="border-b border-[#e5e7eb] pb-6">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Implementation Strategy</h3>
                  <RenderField 
                    content={editedBriefData?.implementationStrategy || brief.briefData.implementationStrategy || ''} 
                    isEditing={isEditing}
                    fieldName="implementationStrategy"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
              
              {/* Success Metrics */}
              {(brief.briefData.successMetrics || isEditing) && (
                <div>
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">Success Metrics</h3>
                  <RenderField 
                    content={editedBriefData?.successMetrics || brief.briefData.successMetrics || ''} 
                    isEditing={isEditing}
                    fieldName="successMetrics"
                    onChange={handleFieldChange}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Link
              href={`/project/${project.id}`}
              className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-5 py-2.5 rounded-lg font-medium hover:bg-[#f0f2f5] transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to project
            </Link>
            <Link
              href={`/brief/${brief.id}/ideate`}
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#0a3f2c] transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {hasFeatures ? (
                  <path d="M8 12H16M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <>
                    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                )}
              </svg>
              {hasFeatures ? 'Go to Features' : 'Ideate Features'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 