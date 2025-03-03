import { GeneratedBrief } from './briefGenerator';
import { PRD } from '../services/prdService';

// Define a more flexible type for PRD content and sections
interface FlexiblePRDContent {
  [key: string]: any;
  sections?: FlexiblePRDSection[];
}

interface FlexiblePRDSection {
  [key: string]: any;
  featureName: string;
  featurePriority?: string;
  overview?: any;
  userStories?: any;
  acceptanceCriteria?: any;
  useCases?: any;
}

/**
 * Converts a brief object to Markdown format
 */
export function briefToMarkdown(brief: GeneratedBrief, projectName: string): string {
  let markdown = `# ${projectName} - Product Brief\n\n`;
  
  // Executive Summary
  markdown += `## Executive Summary\n\n${formatContent(brief.executiveSummary)}\n\n`;
  
  // Problem Statement
  markdown += `## Problem Statement\n\n${formatContent(brief.problemStatement)}\n\n`;
  
  // Target Users
  markdown += `## Target Users\n\n${formatContent(brief.targetUsers)}\n\n`;
  
  // Existing Solutions
  markdown += `## Existing Solutions\n\n${formatContent(brief.existingSolutions)}\n\n`;
  
  // Proposed Solution
  markdown += `## Proposed Solution\n\n${formatContent(brief.proposedSolution)}\n\n`;
  
  // Product Objectives
  markdown += `## Product Objectives\n\n${formatContent(brief.productObjectives)}\n\n`;
  
  // Key Features
  markdown += `## Key Features\n\n${formatContent(brief.keyFeatures)}\n\n`;
  
  // Optional sections
  if (brief.marketAnalysis) {
    markdown += `## Market Analysis\n\n${formatContent(brief.marketAnalysis)}\n\n`;
  }
  
  if (brief.technicalRisks) {
    markdown += `## Technical Risks\n\n${formatContent(brief.technicalRisks)}\n\n`;
  }
  
  if (brief.businessRisks) {
    markdown += `## Business Risks\n\n${formatContent(brief.businessRisks)}\n\n`;
  }
  
  if (brief.implementationStrategy) {
    markdown += `## Implementation Strategy\n\n${formatContent(brief.implementationStrategy)}\n\n`;
  }
  
  if (brief.successMetrics) {
    markdown += `## Success Metrics\n\n${formatContent(brief.successMetrics)}\n\n`;
  }
  
  return markdown;
}

/**
 * Converts a PRD object to Markdown format
 */
export function prdToMarkdown(prd: PRD): string {
  let markdown = `# ${prd.title} - Product Requirements Document\n\n`;
  
  // Log the PRD structure to help debug
  console.log('PRD structure for download:', JSON.stringify(prd, null, 2));
  
  // If we have content object with sections
  if (prd.content) {
    // Handle the case where content has sections (from the PRDViewer component)
    if (prd.content.sections && Array.isArray(prd.content.sections)) {
      markdown += `## Overview\n\n${formatContent(prd.overview || '')}\n\n`;
      
      // Process each feature section
      (prd.content.sections as FlexiblePRDSection[]).forEach((section, index) => {
        markdown += `## Feature: ${section.featureName}\n\n`;
        
        if (section.featurePriority) {
          markdown += `**Priority:** ${section.featurePriority}\n\n`;
        }
        
        // Overview
        if (section.overview) {
          markdown += `### Overview\n\n`;
          
          if (typeof section.overview === 'string') {
            markdown += `${section.overview}\n\n`;
          } else {
            if (section.overview.purpose) {
              markdown += `**Purpose:** ${section.overview.purpose}\n\n`;
            }
            
            if (section.overview.successMetrics && Array.isArray(section.overview.successMetrics)) {
              markdown += `**Success Metrics:**\n\n`;
              section.overview.successMetrics.forEach((metric: string, i: number) => {
                markdown += `${i + 1}. ${metric}\n`;
              });
              markdown += `\n`;
            }
          }
        }
        
        // User Stories
        if (section.userStories && Array.isArray(section.userStories)) {
          markdown += `### User Stories\n\n`;
          section.userStories.forEach((story: string, i: number) => {
            markdown += `${i + 1}. ${story}\n`;
          });
          markdown += `\n`;
        }
        
        // Acceptance Criteria
        if (section.acceptanceCriteria) {
          markdown += `### Acceptance Criteria\n\n`;
          
          if (typeof section.acceptanceCriteria === 'string') {
            markdown += `${section.acceptanceCriteria}\n\n`;
          } else {
            if (section.acceptanceCriteria.guidelines) {
              markdown += `**Guidelines:** ${section.acceptanceCriteria.guidelines}\n\n`;
            }
            
            if (section.acceptanceCriteria.criteria && Array.isArray(section.acceptanceCriteria.criteria)) {
              section.acceptanceCriteria.criteria.forEach((criteria: string, i: number) => {
                markdown += `${i + 1}. ${criteria}\n`;
              });
              markdown += `\n`;
            }
          }
        }
        
        // Use Cases
        if (section.useCases && Array.isArray(section.useCases)) {
          markdown += `### Use Cases\n\n`;
          section.useCases.forEach((useCase: any, i: number) => {
            markdown += `#### ${useCase.title || `Use Case ${i + 1}`}\n\n`;
            
            if (useCase.description) {
              markdown += `${useCase.description}\n\n`;
            }
            
            // Handle different use case formats
            if (useCase.steps && Array.isArray(useCase.steps)) {
              markdown += `**Steps:**\n\n`;
              useCase.steps.forEach((step: string, j: number) => {
                markdown += `${j + 1}. ${step}\n`;
              });
              markdown += `\n`;
            } else if (useCase.mainScenario && Array.isArray(useCase.mainScenario)) {
              markdown += `**Main Scenario:**\n\n`;
              useCase.mainScenario.forEach((step: string, j: number) => {
                markdown += `${j + 1}. ${step}\n`;
              });
              markdown += `\n`;
            }
            
            // Handle alternate flows if present
            if (useCase.alternateFlows && Array.isArray(useCase.alternateFlows)) {
              markdown += `**Alternate Flows:**\n\n`;
              useCase.alternateFlows.forEach((flow: any, j: number) => {
                markdown += `- ${flow.name || `Flow ${j + 1}`}:\n`;
                if (flow.steps && Array.isArray(flow.steps)) {
                  flow.steps.forEach((step: string, k: number) => {
                    markdown += `  ${k + 1}. ${step}\n`;
                  });
                }
                markdown += `\n`;
              });
            }
          });
        }
        
        // Technical Requirements - using any type to avoid linter errors
        const sectionAny = section as any;
        if (sectionAny.technicalRequirements) {
          markdown += `### Technical Requirements\n\n`;
          
          if (typeof sectionAny.technicalRequirements === 'string') {
            markdown += `${sectionAny.technicalRequirements}\n\n`;
          } else if (Array.isArray(sectionAny.technicalRequirements)) {
            sectionAny.technicalRequirements.forEach((req: string, i: number) => {
              markdown += `${i + 1}. ${req}\n`;
            });
            markdown += `\n`;
          }
        }
        
        // Dependencies - using any type to avoid linter errors
        if (sectionAny.dependencies) {
          markdown += `### Dependencies\n\n`;
          
          if (typeof sectionAny.dependencies === 'string') {
            markdown += `${sectionAny.dependencies}\n\n`;
          } else if (Array.isArray(sectionAny.dependencies)) {
            sectionAny.dependencies.forEach((dep: string, i: number) => {
              markdown += `${i + 1}. ${dep}\n`;
            });
            markdown += `\n`;
          }
        }
        
        // Risks - using any type to avoid linter errors
        if (sectionAny.risks) {
          markdown += `### Risks\n\n`;
          
          if (typeof sectionAny.risks === 'string') {
            markdown += `${sectionAny.risks}\n\n`;
          } else if (Array.isArray(sectionAny.risks)) {
            sectionAny.risks.forEach((risk: string, i: number) => {
              markdown += `${i + 1}. ${risk}\n`;
            });
            markdown += `\n`;
          }
        }
      });
    } else {
      // Handle the case where content is a flat object (from the old format)
      const content = prd.content as FlexiblePRDContent;
      
      // Overview
      if (content.overview || prd.overview) {
        markdown += `## Overview\n\n${formatContent(content.overview || prd.overview || '')}\n\n`;
      }
      
      // Goals
      if (content.goals || prd.goals) {
        markdown += `## Goals\n\n${formatContent(content.goals || prd.goals || '')}\n\n`;
      }
      
      // User Stories
      if (content.userStories) {
        markdown += `## User Stories\n\n`;
        
        if (Array.isArray(content.userStories)) {
          content.userStories.forEach((story: any, index: number) => {
            markdown += `### User Story ${index + 1}\n\n`;
            if (typeof story === 'string') {
              markdown += `${story}\n\n`;
            } else if (story.description) {
              markdown += `${story.description}\n\n`;
              
              if (story.acceptanceCriteria && Array.isArray(story.acceptanceCriteria)) {
                markdown += `#### Acceptance Criteria\n\n`;
                story.acceptanceCriteria.forEach((criteria: string, i: number) => {
                  markdown += `${i + 1}. ${criteria}\n`;
                });
                markdown += `\n`;
              }
            }
          });
        } else {
          markdown += `${formatContent(content.userStories)}\n\n`;
        }
      }
      
      // User Flows
      if (content.userFlows || prd.userFlows) {
        markdown += `## User Flows\n\n${formatContent(content.userFlows || prd.userFlows || '')}\n\n`;
      }
      
      // Requirements
      if (content.requirements || prd.requirements) {
        markdown += `## Requirements\n\n`;
        
        if (Array.isArray(content.requirements)) {
          content.requirements.forEach((req: any, index: number) => {
            if (typeof req === 'string') {
              markdown += `${index + 1}. ${req}\n`;
            } else if (req.description) {
              markdown += `### ${req.title || `Requirement ${index + 1}`}\n\n`;
              markdown += `${req.description}\n\n`;
              
              if (req.details) {
                markdown += `${req.details}\n\n`;
              }
            }
          });
        } else {
          markdown += `${formatContent(content.requirements || prd.requirements || '')}\n\n`;
        }
      }
      
      // Technical Requirements
      if (content.technicalRequirements) {
        markdown += `## Technical Requirements\n\n${formatContent(content.technicalRequirements)}\n\n`;
      }
      
      // Constraints
      if (content.constraints || prd.constraints) {
        markdown += `## Constraints\n\n${formatContent(content.constraints || prd.constraints || '')}\n\n`;
      }
      
      // Timeline
      if (content.timeline || prd.timeline) {
        markdown += `## Timeline\n\n${formatContent(content.timeline || prd.timeline || '')}\n\n`;
      }
      
      // Success Metrics
      if (content.successMetrics) {
        markdown += `## Success Metrics\n\n${formatContent(content.successMetrics)}\n\n`;
      }
      
      // Additional sections
      if (content.additionalNotes) {
        markdown += `## Additional Notes\n\n${formatContent(content.additionalNotes)}\n\n`;
      }
    }
  } else {
    // Fallback to basic fields if content object is not available
    if (prd.overview) {
      markdown += `## Overview\n\n${formatContent(prd.overview)}\n\n`;
    }
    
    if (prd.goals) {
      markdown += `## Goals\n\n${formatContent(prd.goals)}\n\n`;
    }
    
    if (prd.userFlows) {
      markdown += `## User Flows\n\n${formatContent(prd.userFlows)}\n\n`;
    }
    
    if (prd.requirements) {
      markdown += `## Requirements\n\n${formatContent(prd.requirements)}\n\n`;
    }
    
    if (prd.constraints) {
      markdown += `## Constraints\n\n${formatContent(prd.constraints)}\n\n`;
    }
    
    if (prd.timeline) {
      markdown += `## Timeline\n\n${formatContent(prd.timeline)}\n\n`;
    }
  }
  
  return markdown;
}

/**
 * Helper function to format content that might be JSON
 */
function formatContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      // Format JSON object as markdown
      return Object.entries(parsed)
        .map(([key, value]) => `### ${key}\n${value}`)
        .join('\n\n');
    }
  } catch (e) {
    // Not JSON, return as is
  }
  return content;
}

/**
 * Downloads content as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/markdown') {
  // Create a blob
  const blob = new Blob([content], { type: mimeType });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Append to the body, click, and remove
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
} 