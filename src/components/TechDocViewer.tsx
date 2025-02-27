import React, { useState, useEffect } from 'react';
import { TechDoc, techDocStore } from '../utils/techDocStore';

interface TechDocViewerProps {
  techDoc: TechDoc;
  onUpdate?: (updatedTechDoc: TechDoc) => void;
}

interface ParsedTechStack {
  overview?: string;
  frontend?: string;
  backend?: string;
  database?: string;
  deployment?: string;
  thirdPartyServices?: string;
  [key: string]: string | undefined;
}

interface ParsedFrontendGuidelines {
  overview?: string;
  colorPalette?: string;
  typography?: string;
  componentStructure?: string;
  responsiveDesign?: string;
  accessibilityConsiderations?: string;
  uiReferences?: string;
  [key: string]: string | undefined;
}

interface ParsedBackendStructure {
  overview?: string;
  apiRoutes?: string;
  databaseSchema?: string;
  authentication?: string;
  integrations?: string;
  dataProcessing?: string;
  [key: string]: string | undefined;
}

interface ParsedTechDoc {
  techStack?: ParsedTechStack;
  frontendGuidelines?: ParsedFrontendGuidelines;
  backendStructure?: ParsedBackendStructure;
}

export default function TechDocViewer({ techDoc, onUpdate }: TechDocViewerProps) {
  const [activeTab, setActiveTab] = useState<'tech-stack' | 'frontend' | 'backend'>('tech-stack');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState({
    techStack: techDoc.techStack || '',
    frontend: techDoc.frontend || '',
    backend: techDoc.backend || ''
  });
  const [parsedContent, setParsedContent] = useState<ParsedTechDoc>({});

  useEffect(() => {
    parseDocContent();
    
    // Update edited content when techDoc changes
    setEditedContent({
      techStack: techDoc.techStack || '',
      frontend: techDoc.frontend || '',
      backend: techDoc.backend || ''
    });
  }, [techDoc]);

  const parseDocContent = () => {
    const parsed: ParsedTechDoc = {};
    
    try {
      console.log('Parsing tech doc content:', {
        techStack: techDoc.techStack ? techDoc.techStack.substring(0, 100) + '...' : null,
        frontend: techDoc.frontend ? techDoc.frontend.substring(0, 100) + '...' : null,
        backend: techDoc.backend ? techDoc.backend.substring(0, 100) + '...' : null
      });
      
      // First try to parse as a complete TechDocumentation object
      if (techDoc.techStack) {
        try {
          const fullDoc = JSON.parse(techDoc.techStack);
          console.log('Parsed techStack as JSON:', Object.keys(fullDoc));
          
          if (fullDoc.techStack) {
            // This is the full documentation object
            parsed.techStack = fullDoc.techStack;
            parsed.frontendGuidelines = fullDoc.frontendGuidelines;
            parsed.backendStructure = fullDoc.backendStructure;
            console.log('Found complete doc in techStack field');
          } else {
            // This is just the techStack section
            parsed.techStack = fullDoc;
            console.log('Found only techStack section');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('techStack is not valid JSON, treating as plain text');
          parsed.techStack = {
            overview: techDoc.techStack
          };
        }
      }
      
      // Try to parse frontend if we don't already have it
      if (techDoc.frontend && !parsed.frontendGuidelines) {
        try {
          const frontendData = JSON.parse(techDoc.frontend);
          console.log('Parsed frontend as JSON:', Object.keys(frontendData));
          
          if (frontendData.frontendGuidelines) {
            // This contains the frontendGuidelines section
            parsed.frontendGuidelines = frontendData.frontendGuidelines;
            console.log('Found frontendGuidelines section');
          } else {
            // This is just the frontendGuidelines section
            parsed.frontendGuidelines = frontendData;
            console.log('Found only frontend data');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('frontend is not valid JSON, treating as plain text');
          parsed.frontendGuidelines = {
            overview: techDoc.frontend
          };
        }
      }
      
      // Try to parse backend if we don't already have it
      if (techDoc.backend && !parsed.backendStructure) {
        try {
          const backendData = JSON.parse(techDoc.backend);
          console.log('Parsed backend as JSON:', Object.keys(backendData));
          
          if (backendData.backendStructure) {
            // This contains the backendStructure section
            parsed.backendStructure = backendData.backendStructure;
            console.log('Found backendStructure section');
          } else {
            // This is just the backendStructure section
            parsed.backendStructure = backendData;
            console.log('Found only backend data');
          }
        } catch (e) {
          // If it's not valid JSON, treat it as plain text
          console.log('backend is not valid JSON, treating as plain text');
          parsed.backendStructure = {
            overview: techDoc.backend
          };
        }
      }
      
      console.log('Final parsed content:', {
        techStack: parsed.techStack ? Object.keys(parsed.techStack) : null,
        frontendGuidelines: parsed.frontendGuidelines ? Object.keys(parsed.frontendGuidelines) : null,
        backendStructure: parsed.backendStructure ? Object.keys(parsed.backendStructure) : null
      });
    } catch (error) {
      console.error('Error parsing tech doc content:', error);
    }
    
    setParsedContent(parsed);
  };

  const handleSave = () => {
    const updatedTechDoc = {
      ...techDoc,
      techStack: editedContent.techStack,
      frontend: editedContent.frontend,
      backend: editedContent.backend
    };
    
    const savedTechDoc = techDocStore.updateTechDoc(updatedTechDoc);
    
    if (onUpdate) {
      onUpdate(savedTechDoc);
    }
    
    setIsEditing(false);
    parseDocContent();
  };

  const handleCancel = () => {
    setEditedContent({
      techStack: techDoc.techStack || '',
      frontend: techDoc.frontend || '',
      backend: techDoc.backend || ''
    });
    setIsEditing(false);
  };

  const getTemplateForTab = (tab: 'tech-stack' | 'frontend' | 'backend'): string => {
    switch (tab) {
      case 'tech-stack':
        return `{
  "overview": "Brief overview of the technology stack",
  "frontend": "Frontend technologies with justification",
  "backend": "Backend technologies with justification",
  "database": "Database recommendations with justification",
  "deployment": "Deployment and hosting recommendations",
  "thirdPartyServices": "Any third-party services or APIs needed"
}`;
      case 'frontend':
        return `{
  "overview": "Brief overview of the frontend guidelines",
  "colorPalette": "Recommended color palette with hex codes (e.g. #0F533A, #8b5cf6)",
  "typography": "Typography recommendations including font families and sizes",
  "componentStructure": "How components should be organized and structured",
  "responsiveDesign": "Guidelines for ensuring the application works across devices",
  "accessibilityConsiderations": "Key accessibility requirements to implement",
  "uiReferences": "References to similar UIs or design systems for inspiration"
}`;
      case 'backend':
        return `{
  "overview": "Brief overview of the backend architecture",
  "apiRoutes": "Recommended API route structure",
  "databaseSchema": "High-level database schema design",
  "authentication": "Authentication and authorization approach",
  "integrations": "Details on external integrations or APIs",
  "dataProcessing": "How data should be processed and transformed"
}`;
      default:
        return '';
    }
  };

  const handleCreateDocumentation = () => {
    setIsEditing(true);
    
    // If the current tab's content is empty, provide a template
    const newContent = { ...editedContent };
    
    switch (activeTab) {
      case 'tech-stack':
        if (!newContent.techStack || newContent.techStack.trim() === '') {
          newContent.techStack = getTemplateForTab('tech-stack');
        }
        break;
      case 'frontend':
        if (!newContent.frontend || newContent.frontend.trim() === '') {
          newContent.frontend = getTemplateForTab('frontend');
        }
        break;
      case 'backend':
        if (!newContent.backend || newContent.backend.trim() === '') {
          newContent.backend = getTemplateForTab('backend');
        }
        break;
    }
    
    setEditedContent(newContent);
  };

  const renderSectionTitle = (title: string) => (
    <h3 className="text-lg font-semibold text-[#111827] mt-6 mb-3">{title}</h3>
  );

  const renderSubsection = (title: string, content?: string) => {
    if (!content) return null;
    
    return (
      <div className="mb-6">
        <h4 className="text-base font-medium text-[#374151] mb-2">{title}</h4>
        <div className="text-[#4b5563] text-sm leading-relaxed whitespace-pre-line">
          {content}
        </div>
      </div>
    );
  };

  const renderPlainTextContent = (content: string) => {
    if (!content) return null;
    
    // Basic Markdown formatting
    const formattedContent = content
      // Format headers
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mt-4 mb-2">$1</h3>')
      // Format lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1">$1. $2</li>')
      // Format code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded my-2 font-mono text-sm overflow-x-auto">$1</pre>')
      // Format inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Format paragraphs (add spacing between paragraphs)
      .replace(/\n\n/g, '</p><p class="mb-3">');
    
    return (
      <div className="mt-6">
        <div 
          className="text-[#4b5563] text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${formattedContent}</p>` }}
        />
      </div>
    );
  };

  const renderColorPalette = (colors?: string) => {
    if (!colors) return null;
    
    // Extract hex colors from the string
    const colorMatches = colors.match(/#[0-9A-Fa-f]{6}/g) || [];
    
    return (
      <div className="mb-6">
        <h4 className="text-base font-medium text-[#374151] mb-2">Color Palette</h4>
        <div className="text-[#4b5563] text-sm leading-relaxed mb-3">
          {colors}
        </div>
        {colorMatches.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {colorMatches.map((color, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-md shadow-sm border border-gray-200" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs mt-1 font-mono">{color}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTechStackContent = () => {
    const techStack = parsedContent.techStack;
    
    if (!techStack) {
      return <p className="text-gray-500 mt-6">No tech stack information available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(techStack).length === 1 && techStack.overview && techStack.overview.includes('#')) {
      return renderPlainTextContent(techStack.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', techStack.overview)}
        {renderSubsection('Frontend', techStack.frontend)}
        {renderSubsection('Backend', techStack.backend)}
        {renderSubsection('Database', techStack.database)}
        {renderSubsection('Deployment', techStack.deployment)}
        {renderSubsection('Third-Party Services', techStack.thirdPartyServices)}
      </div>
    );
  };

  const renderFrontendContent = () => {
    const frontend = parsedContent.frontendGuidelines;
    
    if (!frontend) {
      return <p className="text-gray-500 mt-6">No frontend guidelines available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(frontend).length === 1 && frontend.overview && frontend.overview.includes('#')) {
      return renderPlainTextContent(frontend.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', frontend.overview)}
        {renderColorPalette(frontend.colorPalette)}
        {renderSubsection('Typography', frontend.typography)}
        {renderSubsection('Component Structure', frontend.componentStructure)}
        {renderSubsection('Responsive Design', frontend.responsiveDesign)}
        {renderSubsection('Accessibility Considerations', frontend.accessibilityConsiderations)}
        {renderSubsection('UI References', frontend.uiReferences)}
      </div>
    );
  };

  const renderBackendContent = () => {
    const backend = parsedContent.backendStructure;
    
    if (!backend) {
      return <p className="text-gray-500 mt-6">No backend structure information available</p>;
    }
    
    // Check if this is just plain text content
    if (Object.keys(backend).length === 1 && backend.overview && backend.overview.includes('#')) {
      return renderPlainTextContent(backend.overview);
    }
    
    return (
      <div className="mt-6">
        {renderSubsection('Overview', backend.overview)}
        {renderSubsection('API Routes', backend.apiRoutes)}
        {renderSubsection('Database Schema', backend.databaseSchema)}
        {renderSubsection('Authentication', backend.authentication)}
        {renderSubsection('Integrations', backend.integrations)}
        {renderSubsection('Data Processing', backend.dataProcessing)}
      </div>
    );
  };

  const renderContent = () => {
    if (isEditing) {
      let content = '';
      
      switch (activeTab) {
        case 'tech-stack':
          content = editedContent.techStack;
          break;
        case 'frontend':
          content = editedContent.frontend;
          break;
        case 'backend':
          content = editedContent.backend;
          break;
      }
      
      return (
        <div className="mt-6">
          <textarea
            className="w-full h-[500px] p-4 border border-[#e5e7eb] rounded-lg font-mono text-sm"
            value={content}
            onChange={(e) => {
              const newContent = { ...editedContent };
              switch (activeTab) {
                case 'tech-stack':
                  newContent.techStack = e.target.value;
                  break;
                case 'frontend':
                  newContent.frontend = e.target.value;
                  break;
                case 'backend':
                  newContent.backend = e.target.value;
                  break;
              }
              setEditedContent(newContent);
            }}
          />
          
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      );
    }
    
    // Check if all content is empty
    const isEmpty = 
      (!techDoc.techStack || techDoc.techStack.trim() === '') &&
      (!techDoc.frontend || techDoc.frontend.trim() === '') &&
      (!techDoc.backend || techDoc.backend.trim() === '');
    
    if (isEmpty) {
      return (
        <div className="mt-6 text-center p-8">
          <p className="text-gray-500 mb-4">No technical documentation available yet.</p>
          <button
            onClick={handleCreateDocumentation}
            className="inline-flex items-center justify-center bg-[#0F533A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3f2c] transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.91 4.15002C15.58 6.54002 17.45 8.41002 19.85 9.09002" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Documentation
          </button>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'tech-stack':
        return renderTechStackContent();
      case 'frontend':
        return renderFrontendContent();
      case 'backend':
        return renderBackendContent();
      default:
        return <p className="text-gray-500 mt-6">Select a tab to view content</p>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>
          <h2 className="text-xl font-semibold text-[#111827]">Technical Documentation</h2>
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center justify-center bg-white border border-[#e5e7eb] text-[#4b5563] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f0f2f5] transition-colors"
        >
          {isEditing ? (
            <>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.17 14.83L14.83 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.83 14.83L9.17 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cancel Editing
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.91 4.15002C15.58 6.54002 17.45 8.41002 19.85 9.09002" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Documentation
            </>
          )}
        </button>
      </div>
      
      <div className="border-b border-[#e5e7eb]">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('tech-stack')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'tech-stack'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Tech Stack
          </button>
          <button
            onClick={() => setActiveTab('frontend')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'frontend'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Frontend Guidelines
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'backend'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            Backend Structure
          </button>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}
