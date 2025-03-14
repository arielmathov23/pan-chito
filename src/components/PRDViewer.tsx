import React, { useState, useEffect } from 'react';
import { PRD } from '../services/prdService';
import { PRDSection } from '../utils/prdGenerator';

interface PRDViewerProps {
  prd: PRD;
  onUpdate: (updatedPRD: PRD) => void;
}

export default function PRDViewer({ prd, onUpdate }: PRDViewerProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Helper function to safely render content that might be an object
  // This ensures objects are properly stringified before rendering
  const safeRender = (content: any): string => {
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'string') {
      return content;
    }
    return JSON.stringify(content, null, 2);
  };

  // Initialize the selected feature when the PRD changes or on first load
  useEffect(() => {
    if (prd && prd.content && prd.content.sections && prd.content.sections.length > 0) {
      // Set the first feature as selected by default if none is selected
      if (!selectedFeature) {
        setSelectedFeature(prd.content.sections[0].featureName);
        setActiveSection(prd.content.sections[0].featureName); // Auto-select first feature
      } else {
        // Check if the currently selected feature exists in the new PRD
        const featureExists = prd.content.sections.some(
          section => section.featureName === selectedFeature
        );
        
        // If not, select the first feature
        if (!featureExists && prd.content.sections.length > 0) {
          setSelectedFeature(prd.content.sections[0].featureName);
          setActiveSection(prd.content.sections[0].featureName); // Auto-select first feature
        }
      }
    }
  }, [prd, selectedFeature]);

  // Get all sections from the PRD
  const getSections = (): PRDSection[] => {
    if (!prd || !prd.content || !prd.content.sections) {
      return [];
    }
    return prd.content.sections;
  };

  const handleEditClick = (section: string, content: any) => {
    setEditingSection(section);
    setEditContent(safeRender(content));
  };

  const handleSaveClick = (section: string) => {
    if (!onUpdate) return;

    const updatedPRD = { ...prd, [section]: editContent };
    onUpdate(updatedPRD);
    setEditingSection(null);
  };

  const handleCancelClick = () => {
    setEditingSection(null);
  };

  const handleDeleteFeature = (featureName: string) => {
    if (window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      const sections = getSections();
      const updatedPRD: PRD = {
        ...prd,
        content: {
          ...prd.content,
          sections: sections.filter(section => section.featureName !== featureName)
        }
      };
      onUpdate(updatedPRD);
      
      // Select another feature if available
      const remainingSections = updatedPRD.content.sections;
      if (remainingSections.length > 0) {
        setSelectedFeature(remainingSections[0].featureName);
      } else {
        setSelectedFeature('');
      }
    }
  };

  const renderSection = (title: string, content: any, section: string) => {
    const isEditing = editingSection === section;
    const isActive = activeSection === section;
    const contentStr = safeRender(content);

    return (
      <div className="mb-8 last:mb-0" key={section}>
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => setActiveSection(isActive ? null : section)}
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {onUpdate && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(section, content);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.26 3.59997L5.04997 12.29C4.73997 12.62 4.43997 13.27 4.37997 13.72L4.00997 16.96C3.87997 18.13 4.71997 18.93 5.87997 18.73L9.09997 18.18C9.54997 18.1 10.18 17.77 10.49 17.43L18.7 8.73997C20.12 7.23997 20.76 5.52997 18.55 3.43997C16.35 1.36997 14.68 2.09997 13.26 3.59997Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.89 5.05005C12.32 7.81005 14.56 9.92005 17.34 10.2" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 22H21" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isActive ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {(isActive || isEditing) && (
          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F533A] focus:border-transparent min-h-[200px] text-sm"
                  placeholder={`Enter ${title.toLowerCase()} here...`}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelClick}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveClick(section)}
                    className="px-3 py-1.5 text-sm bg-[#0F533A] text-white rounded-lg hover:bg-[#0a3f2c]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words overflow-x-auto">
                {contentStr.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const sections = getSections();
  const priorityOrder = { must: 0, should: 1, could: 2, wont: 3 };
  const sortedSections = [...sections].sort((a, b) => 
    priorityOrder[a.featurePriority] - priorityOrder[b.featurePriority]
  );

  // Find the selected feature
  const selectedFeatureObj = sections.find(s => s.featureName === activeSection);

  // Mobile-friendly layout
  return (
    <div className="w-full">
      {/* Mobile Feature Selection */}
      <div className="block md:hidden mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">FEATURES</h2>
          <div className="space-y-2">
            {sortedSections.map((section) => (
              <button
                key={section.featureName}
                onClick={() => setActiveSection(section.featureName)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  activeSection === section.featureName
                    ? 'bg-[#0F533A]/5 text-[#0F533A]'
                    : 'text-[#4b5563] hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{safeRender(section.featureName)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  {
                    must: 'bg-red-100 text-red-800',
                    should: 'bg-blue-100 text-blue-800',
                    could: 'bg-green-100 text-green-800',
                    wont: 'bg-gray-100 text-gray-800'
                  }[section.featurePriority]
                }`}>
                  {safeRender(section.featurePriority?.toUpperCase() || '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Feature Navigation */}
        <div className="w-64 bg-white border-r border-[#e5e7eb] overflow-y-auto p-4">
          <h2 className="text-sm font-medium text-[#6b7280] uppercase tracking-wider mb-4">Features</h2>
          <div className="space-y-1">
            {sortedSections.map((section) => (
              <button
                key={section.featureName}
                onClick={() => setActiveSection(section.featureName)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.featureName
                    ? 'bg-[#0F533A]/5 text-[#0F533A]'
                    : 'text-[#4b5563] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{safeRender(section.featureName)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    {
                      must: 'bg-red-100 text-red-800',
                      should: 'bg-blue-100 text-blue-800',
                      could: 'bg-green-100 text-green-800',
                      wont: 'bg-gray-100 text-gray-800'
                    }[section.featurePriority]
                  }`}>
                    {safeRender(section.featurePriority?.toUpperCase() || '')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeSection && selectedFeatureObj ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-[#111827]">{safeRender(selectedFeatureObj.featureName)}</h1>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    {
                      must: 'bg-red-100 text-red-800',
                      should: 'bg-blue-100 text-blue-800',
                      could: 'bg-green-100 text-green-800',
                      wont: 'bg-gray-100 text-gray-800'
                    }[selectedFeatureObj.featurePriority]
                  }`}>
                    {safeRender(selectedFeatureObj.featurePriority?.toUpperCase() || '')}
                  </span>
                </div>
                {onUpdate && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEditClick(activeSection, selectedFeatureObj)}
                      className="text-[#6b7280] hover:text-[#111827] transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Feature content sections */}
              <div className="space-y-8">
                {/* Overview */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Purpose</h4>
                      <p className="text-[#111827]">{safeRender(selectedFeatureObj.overview?.purpose) || "No purpose specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Success Metrics</h4>
                      {selectedFeatureObj.overview?.successMetrics && selectedFeatureObj.overview.successMetrics.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.overview.successMetrics.map((metric, index) => (
                            <li key={index}>{safeRender(metric)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No success metrics specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Stories */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">User Stories</h3>
                  {selectedFeatureObj.userStories && selectedFeatureObj.userStories.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-[#111827]">
                      {selectedFeatureObj.userStories.map((story, index) => (
                        <li key={index} className="pl-1">{safeRender(story)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No user stories specified</p>
                  )}
                </div>

                {/* Acceptance Criteria */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Acceptance Criteria</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Guidelines</h4>
                      <p className="text-[#111827]">{safeRender(selectedFeatureObj.acceptanceCriteria?.guidelines) || "No guidelines specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Criteria</h4>
                      {selectedFeatureObj.acceptanceCriteria?.criteria && selectedFeatureObj.acceptanceCriteria.criteria.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.acceptanceCriteria.criteria.map((criterion, index) => (
                            <li key={index}>{safeRender(criterion)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No criteria specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Use Cases */}
                {selectedFeatureObj.useCases && selectedFeatureObj.useCases.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Use Cases</h3>
                    <div className="space-y-6">
                  {selectedFeatureObj.useCases.map((useCase, index) => (
                        <div key={index} className="border-b border-[#e5e7eb] pb-6 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-xs font-medium bg-[#f0f2f5] text-[#6b7280] px-2 py-1 rounded mr-2">
                                {useCase.id}
                              </span>
                              <h4 className="text-md font-medium text-[#111827] inline">{safeRender(useCase.title)}</h4>
                            </div>
                      </div>
                          <p className="text-[#4b5563] mb-4">{safeRender(useCase.description)}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                              <h5 className="text-sm font-medium text-[#4b5563] mb-2">Actors</h5>
                              <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                                {useCase.actors.map((actor, idx) => (
                                  <li key={idx}>{safeRender(actor)}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                              <h5 className="text-sm font-medium text-[#4b5563] mb-2">Preconditions</h5>
                              <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                                {useCase.preconditions.map((precondition, idx) => (
                                  <li key={idx}>{safeRender(precondition)}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-[#4b5563] mb-2">Main Scenario</h5>
                            <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                              {useCase.mainScenario.map((step, idx) => (
                                <li key={idx}>{safeRender(step)}</li>
                            ))}
                          </ol>
                        </div>
                          
                          {useCase.alternateFlows && useCase.alternateFlows.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-[#4b5563] mb-2">Alternate Flows</h5>
                              {useCase.alternateFlows.map((flow, idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                  <h6 className="text-sm font-medium text-[#111827] mb-1">{safeRender(flow.name)}</h6>
                                  <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                                    {flow.steps.map((step, stepIdx) => (
                                      <li key={stepIdx}>{safeRender(step)}</li>
                                    ))}
                                  </ol>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {useCase.exceptions && useCase.exceptions.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-[#4b5563] mb-2">Exceptions</h5>
                              {useCase.exceptions.map((exception, idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                  <h6 className="text-sm font-medium text-[#111827] mb-1">{safeRender(exception.name)}</h6>
                                  <ol className="list-decimal pl-5 space-y-1 text-[#111827]">
                                    {exception.steps.map((step, stepIdx) => (
                                      <li key={stepIdx}>{safeRender(step)}</li>
                                    ))}
                                  </ol>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Non-Functional Requirements */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Non-Functional Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Performance</h4>
                      {selectedFeatureObj.nonFunctionalRequirements?.performance && selectedFeatureObj.nonFunctionalRequirements.performance.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.nonFunctionalRequirements.performance.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No performance requirements specified</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Security</h4>
                      {selectedFeatureObj.nonFunctionalRequirements?.security && selectedFeatureObj.nonFunctionalRequirements.security.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.nonFunctionalRequirements.security.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No security requirements specified</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Scalability</h4>
                      {selectedFeatureObj.nonFunctionalRequirements?.scalability && selectedFeatureObj.nonFunctionalRequirements.scalability.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.nonFunctionalRequirements.scalability.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No scalability requirements specified</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Usability</h4>
                      {selectedFeatureObj.nonFunctionalRequirements?.usability && selectedFeatureObj.nonFunctionalRequirements.usability.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.nonFunctionalRequirements.usability.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No usability requirements specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dependencies */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Dependencies & Assumptions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Dependencies</h4>
                      {selectedFeatureObj.dependencies?.dependencies && selectedFeatureObj.dependencies.dependencies.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.dependencies.dependencies.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No dependencies specified</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Assumptions</h4>
                      {selectedFeatureObj.dependencies?.assumptions && selectedFeatureObj.dependencies.assumptions.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.dependencies.assumptions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No assumptions specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Open Questions */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Open Questions & Risks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Open Questions</h4>
                      {selectedFeatureObj.openQuestions?.questions && selectedFeatureObj.openQuestions.questions.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.openQuestions.questions.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No open questions specified</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#4b5563] mb-2">Risks</h4>
                      {selectedFeatureObj.openQuestions?.risks && selectedFeatureObj.openQuestions.risks.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                          {selectedFeatureObj.openQuestions.risks.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#6b7280] italic">No risks specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wireframe Guidelines */}
                <div className="bg-white rounded-xl p-6 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111827] mb-4">Wireframe Guidelines</h3>
                  {selectedFeatureObj.wireframeGuidelines && selectedFeatureObj.wireframeGuidelines.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-[#111827]">
                      {selectedFeatureObj.wireframeGuidelines.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#6b7280] italic">No wireframe guidelines specified</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a feature to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Feature Content */}
      {activeSection && selectedFeatureObj && (
        <div className="block md:hidden mt-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{safeRender(selectedFeatureObj.featureName)}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                {
                  must: 'bg-red-100 text-red-800',
                  should: 'bg-blue-100 text-blue-800',
                  could: 'bg-green-100 text-green-800',
                  wont: 'bg-gray-100 text-gray-800'
                }[selectedFeatureObj.featurePriority]
              }`}>
                {safeRender(selectedFeatureObj.featurePriority?.toUpperCase() || '')}
              </span>
            </div>

            {/* Feature content sections for mobile */}
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Purpose</h4>
                  <p className="text-gray-800 text-sm">{safeRender(selectedFeatureObj.overview?.purpose) || "No purpose specified"}</p>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Success Metrics</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {selectedFeatureObj.overview?.successMetrics && selectedFeatureObj.overview.successMetrics.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1 text-gray-800 text-sm">
                        {selectedFeatureObj.overview.successMetrics.map((metric, index) => (
                          <li key={index}>{safeRender(metric)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No success metrics specified</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Stories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Stories</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  {selectedFeatureObj.userStories && selectedFeatureObj.userStories.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-2 text-gray-800 text-sm">
                      {selectedFeatureObj.userStories.map((story, index) => (
                        <li key={index}>{safeRender(story)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No user stories specified</p>
                  )}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceptance Criteria</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Guidelines</h4>
                  <p className="text-gray-800 text-sm">{safeRender(selectedFeatureObj.acceptanceCriteria?.guidelines) || "No guidelines specified"}</p>
                  
                  <h4 className="text-sm font-medium text-gray-700 mt-3 mb-1">Criteria</h4>
                  {selectedFeatureObj.acceptanceCriteria?.criteria && selectedFeatureObj.acceptanceCriteria.criteria.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-gray-800 text-sm">
                      {selectedFeatureObj.acceptanceCriteria.criteria.map((criterion, index) => (
                        <li key={index}>{safeRender(criterion)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No criteria specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Show a message only if there are no features at all */}
      {(!activeSection || !selectedFeatureObj) && sections.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">No features available in this PRD</p>
        </div>
      )}
    </div>
  );
} 