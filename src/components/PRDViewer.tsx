import React, { useState } from 'react';
import { PRD } from '../utils/prdStore';
import { PRDSection } from '../utils/prdGenerator';

interface PRDViewerProps {
  prd: PRD;
  onUpdate: (updatedPRD: PRD) => void;
}

export default function PRDViewer({ prd, onUpdate }: PRDViewerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<PRDSection | null>(null);

  const handleEdit = (featureName: string, section: PRDSection) => {
    setEditingFeature(featureName);
    setEditingSection(null);
    setEditedContent({ ...section });
  };

  const handleSave = () => {
    if (!editedContent || !editingFeature) return;

    const updatedPRD: PRD = {
      ...prd,
      content: {
        ...prd.content,
        sections: prd.content.sections.map(section =>
          section.featureName === editingFeature ? editedContent : section
        )
      }
    };

    onUpdate(updatedPRD);
    setEditingFeature(null);
    setEditedContent(null);
  };

  const handleCancel = () => {
    setEditingFeature(null);
    setEditedContent(null);
  };

  const renderEditableField = (
    value: string,
    onChange: (value: string) => void,
    multiline = false
  ) => {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
          rows={3}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
      />
    );
  };

  const renderPrioritySelector = (
    value: 'must' | 'should' | 'could' | 'wont',
    onChange: (value: 'must' | 'should' | 'could' | 'wont') => void
  ) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'must' | 'should' | 'could' | 'wont')}
        className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
      >
        <option value="must">MUST</option>
        <option value="should">SHOULD</option>
        <option value="could">COULD</option>
        <option value="wont">WON'T</option>
      </select>
    );
  };

  const renderEditableList = (
    items: string[],
    onChange: (items: string[]) => void
  ) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index] = e.target.value;
              onChange(newItems);
            }}
            className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0F533A]"
          />
          <button
            onClick={() => {
              const newItems = items.filter((_, i) => i !== index);
              onChange(newItems);
            }}
            className="p-2 text-[#6b7280] hover:text-red-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="text-sm text-[#0F533A] hover:text-[#0a3f2c] font-medium"
      >
        + Add Item
      </button>
    </div>
  );

  const renderSection = (section: PRDSection) => {
    const isEditing = editingFeature === section.featureName;
    const content = isEditing ? editedContent! : section;

    // Priority badge color mapping
    const priorityColors = {
      must: 'bg-red-100 text-red-800',
      should: 'bg-blue-100 text-blue-800',
      could: 'bg-yellow-100 text-yellow-800',
      wont: 'bg-gray-100 text-gray-800'
    };

    const priorityColor = priorityColors[content.featurePriority] || 'bg-gray-100 text-gray-800';

    return (
      <div key={section.featureName} className="border-b border-[#e5e7eb] last:border-b-0 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#111827]">{section.featureName}</h2>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${priorityColor}`}>
              {content.featurePriority?.toUpperCase()}
            </span>
          </div>
          {!isEditing ? (
            <button
              onClick={() => handleEdit(section.featureName, section)}
              className="text-[#0F533A] hover:text-[#0a3f2c]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="text-[#6b7280] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-[#0F533A] text-white px-4 py-2 rounded-lg hover:bg-[#0a3f2c]"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Feature Priority */}
          {isEditing && (
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Feature Priority</h3>
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Priority</label>
                {renderPrioritySelector(
                  content.featurePriority,
                  (value) => setEditedContent({
                    ...content,
                    featurePriority: value
                  })
                )}
              </div>
            </div>
          )}

          {/* Overview */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Overview</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Purpose</label>
                {isEditing ? (
                  renderEditableField(
                    content.overview.purpose,
                    (value) => setEditedContent({
                      ...content,
                      overview: { ...content.overview, purpose: value }
                    }),
                    true
                  )
                ) : (
                  <p className="text-[#111827]">{content.overview.purpose}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Success Metrics</label>
                {isEditing ? (
                  renderEditableList(
                    content.overview.successMetrics,
                    (metrics) => setEditedContent({
                      ...content,
                      overview: { ...content.overview, successMetrics: metrics }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#111827]">
                    {content.overview.successMetrics.map((metric, index) => (
                      <li key={index}>{metric}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* User Stories */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">User Stories</h3>
            {isEditing ? (
              renderEditableList(
                content.userStories,
                (stories) => setEditedContent({ ...content, userStories: stories })
              )
            ) : (
              <ul className="list-disc list-inside space-y-2 text-[#111827]">
                {content.userStories.map((story, index) => (
                  <li key={index}>{story}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Acceptance Criteria</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Guidelines</label>
                {isEditing ? (
                  renderEditableField(
                    content.acceptanceCriteria.guidelines,
                    (value) => setEditedContent({
                      ...content,
                      acceptanceCriteria: { ...content.acceptanceCriteria, guidelines: value }
                    }),
                    true
                  )
                ) : (
                  <p className="text-[#111827]">{content.acceptanceCriteria.guidelines}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Criteria</label>
                {isEditing ? (
                  renderEditableList(
                    content.acceptanceCriteria.criteria,
                    (criteria) => setEditedContent({
                      ...content,
                      acceptanceCriteria: { ...content.acceptanceCriteria, criteria }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#111827]">
                    {content.acceptanceCriteria.criteria.map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Use Cases</h3>
            {content.useCases.map((useCase, index) => (
              <div key={useCase.id} className="bg-[#f8f9fa] p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-[#111827]">{useCase.title}</h4>
                  <span className="text-sm text-[#6b7280]">#{useCase.id}</span>
                </div>
                <div className="space-y-4">
                  <p className="text-[#4b5563]">{useCase.description}</p>
                  <div>
                    <h5 className="font-medium text-[#111827] mb-2">Actors</h5>
                    <ul className="list-disc list-inside text-[#4b5563]">
                      {useCase.actors.map((actor, i) => (
                        <li key={i}>{actor}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-[#111827] mb-2">Main Scenario</h5>
                    <ol className="list-decimal list-inside text-[#4b5563]">
                      {useCase.mainScenario.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Non-Functional Requirements */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Non-Functional Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(content.nonFunctionalRequirements).map(([category, requirements]) => (
                <div key={category}>
                  <h4 className="font-medium text-[#111827] capitalize mb-2">{category}</h4>
                  {isEditing ? (
                    renderEditableList(
                      requirements,
                      (newReqs) => setEditedContent({
                        ...content,
                        nonFunctionalRequirements: {
                          ...content.nonFunctionalRequirements,
                          [category]: newReqs
                        }
                      })
                    )
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                      {requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies and Assumptions */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Dependencies and Assumptions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Dependencies</h4>
                {isEditing ? (
                  renderEditableList(
                    content.dependencies.dependencies,
                    (deps) => setEditedContent({
                      ...content,
                      dependencies: { ...content.dependencies, dependencies: deps }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                    {content.dependencies.dependencies.map((dep, index) => (
                      <li key={index}>{dep}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Assumptions</h4>
                {isEditing ? (
                  renderEditableList(
                    content.dependencies.assumptions,
                    (assumptions) => setEditedContent({
                      ...content,
                      dependencies: { ...content.dependencies, assumptions }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                    {content.dependencies.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Open Questions and Risks */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Open Questions and Risks</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Questions</h4>
                {isEditing ? (
                  renderEditableList(
                    content.openQuestions.questions,
                    (questions) => setEditedContent({
                      ...content,
                      openQuestions: { ...content.openQuestions, questions }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                    {content.openQuestions.questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Risks</h4>
                {isEditing ? (
                  renderEditableList(
                    content.openQuestions.risks,
                    (risks) => setEditedContent({
                      ...content,
                      openQuestions: { ...content.openQuestions, risks }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                    {content.openQuestions.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Mitigations</h4>
                {isEditing ? (
                  renderEditableList(
                    content.openQuestions.mitigations,
                    (mitigations) => setEditedContent({
                      ...content,
                      openQuestions: { ...content.openQuestions, mitigations }
                    })
                  )
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                    {content.openQuestions.mitigations.map((mitigation, index) => (
                      <li key={index}>{mitigation}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Wireframe Guidelines */}
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Wireframe Guidelines</h3>
            {isEditing ? (
              renderEditableList(
                content.wireframeGuidelines,
                (guidelines) => setEditedContent({ ...content, wireframeGuidelines: guidelines })
              )
            ) : (
              <ul className="list-disc list-inside space-y-1 text-[#4b5563]">
                {content.wireframeGuidelines.map((guideline, index) => (
                  <li key={index}>{guideline}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {prd.content.sections.map(renderSection)}
    </div>
  );
} 