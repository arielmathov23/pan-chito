import { Brief } from '../services/briefService';
import { Feature, FeatureSet } from './featureStore';
import { callOpenAI } from './openAIClient';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for testing purposes.');
}

// Remove the OpenAI initialization since we're using openAIClient now
// const openai = new OpenAI({
//   apiKey: apiKey || 'dummy-key',
//   dangerouslyAllowBrowser: true
// });

export interface PRD {
  overview: string;
  userStories: string;
  requirements: string;
  architecture: string;
  dataModel: string;
  api: string;
  userInterface: string;
  implementation: string;
  testing: string;
  deployment: string;
  timeline: string;
  risks: string;
  appendix: string;
}

// Define the PRDSection interface
export interface PRDSection {
  featureName: string;
  featurePriority: string;
  featureId?: string;
  originalFeatureName?: string;
  userStoryName?: string;
  overview: {
    purpose: string;
    successMetrics: string[];
  };
  userStories: string[];
  acceptanceCriteria: {
    guidelines: string;
    criteria: string[];
  };
  useCases: Array<{
    id: string;
    title: string;
    description: string;
    actors: string[];
    preconditions: string[];
    postconditions: string[];
    mainScenario: string[];
    alternateFlows: Array<{
      name: string;
      steps: string[];
    }>;
    exceptions: Array<{
      name: string;
      steps: string[];
    }>;
  }>;
  nonFunctionalRequirements: {
    performance: string[];
    security: string[];
    scalability: string[];
    usability: string[];
    reliability: string[];
    other?: string[];
  };
  dependencies: {
    dependencies: string[];
    assumptions: string[];
  };
  openQuestions: {
    questions: string[];
    risks: string[];
    mitigations: string[];
  };
  wireframeGuidelines: string[];
}

export interface GeneratedPRD {
  sections: PRDSection[];
}

function generateMockPRD(brief: Brief, featureSet: FeatureSet): string {
  // Filter for Must and Should features
  const priorityFeatures = featureSet.features.filter(
    feature => feature.priority === 'must' || feature.priority === 'should'
  );

  const mockPRD: GeneratedPRD = {
    sections: priorityFeatures.map((feature, index) => ({
      featureName: feature.name,
      featurePriority: feature.priority,
      overview: {
        purpose: `Enable users to ${feature.description.toLowerCase()}`,
        successMetrics: [
          `Increase in ${feature.name.toLowerCase()} usage by 20%`,
          `User satisfaction rating above 4.5/5 for this feature`,
          `Reduction in time spent on ${feature.name.toLowerCase()} by 30%`
        ]
      },
      userStories: [
        `As a regular user, I want to ${feature.description.toLowerCase()} so that I can be more productive.`,
        `As a power user, I want advanced options for ${feature.name.toLowerCase()} so that I can customize my experience.`,
        `As a new user, I want clear instructions on how to ${feature.description.toLowerCase()} so that I can get started quickly.`
      ],
      acceptanceCriteria: {
        guidelines: `The ${feature.name} feature should be intuitive, responsive, and accessible to all users.`,
        criteria: [
          `Users can ${feature.description.toLowerCase()} in less than 3 clicks`,
          `Feature works across all supported browsers and devices`,
          `All UI elements follow the design system guidelines`,
          `Feature passes all accessibility requirements`
        ]
      },
      useCases: [
        {
        id: `UC-${index + 1}`,
          title: `Using ${feature.name}`,
          description: `This use case describes how a user interacts with the ${feature.name} feature to ${feature.description.toLowerCase()}.`,
          actors: ["User", "System"],
          preconditions: ["User is authenticated", "User has necessary permissions"],
          postconditions: [`${feature.name} action is completed`, "Data is saved to the database"],
        mainScenario: [
            "User navigates to the feature",
            `User initiates the ${feature.name.toLowerCase()} action`,
            "System validates the input",
            "System processes the request",
            "System displays success confirmation"
          ],
          alternateFlows: [
            {
              name: "Validation Error",
              steps: [
                "System detects invalid input",
                "System displays error message",
                "User corrects input and resubmits"
              ]
            }
          ],
          exceptions: [
            {
              name: "System Error",
              steps: [
                "System encounters an error",
                "System logs the error details",
                "System displays a user-friendly error message",
                "User is provided with next steps or support contact"
              ]
            }
          ]
        }
      ],
      nonFunctionalRequirements: {
        performance: [
          "Page load time under 2 seconds",
          "Response time for actions under 1 second"
        ],
        security: [
          "All data is encrypted in transit and at rest",
          "Feature complies with data protection regulations"
        ],
        scalability: [
          "Feature supports 1000+ concurrent users",
          "Performance does not degrade under heavy load"
        ],
        usability: [
          "Feature is accessible to users with disabilities",
          "UI is consistent with the rest of the application"
        ],
        reliability: [
          "Feature has 99.9% uptime",
          "Automatic error recovery mechanisms are in place"
        ]
      },
      dependencies: {
        dependencies: [
          "Authentication system",
          "Database",
          "API services"
        ],
        assumptions: [
          "Users have modern browsers",
          "Stable internet connection is available",
          "Backend services are operational"
        ]
      },
      openQuestions: {
        questions: [
          `How will ${feature.name} integrate with existing features?`,
          `What is the expected user adoption rate for ${feature.name}?`
        ],
        risks: [
          "Technical implementation complexity",
          "User resistance to change",
          "Integration challenges with legacy systems"
        ],
        mitigations: [
          "Thorough testing before release",
          "Comprehensive user documentation",
          "Phased rollout with feedback collection"
        ]
      },
      wireframeGuidelines: [
        "Follow mobile-first design principles",
        "Use consistent spacing and typography",
        "Ensure all interactive elements have appropriate states (hover, active, disabled)",
        "Provide clear visual feedback for user actions"
      ]
    }))
  };

  return JSON.stringify(mockPRD, null, 2);
}

export async function generatePRD(brief: Brief, featureSet: FeatureSet): Promise<string> {
  if (USE_MOCK) {
    return generateMockPRD(brief, featureSet);
  }

  try {
    const briefData = brief.brief_data;
    
    // Filter and sort features by priority
    const priorityFeatures = featureSet.features
      .filter(feature => feature.priority === 'must' || feature.priority === 'should')
      .sort((a, b) => {
        // Sort 'must' before 'should'
        if (a.priority === 'must' && b.priority === 'should') return -1;
        if (a.priority === 'should' && b.priority === 'must') return 1;
        return 0;
      });
    
    // Increase limit to 8 features
    const FEATURE_LIMIT = 8;
    const featuresForPRD = priorityFeatures.slice(0, FEATURE_LIMIT);
    
    // Add a note if features were limited
    const wasLimited = priorityFeatures.length > FEATURE_LIMIT;
    
    const prompt = `
      Create a detailed Product Requirements Document (PRD) for all the features of a new product.
      ${wasLimited ? `\nNote: Processing ${FEATURE_LIMIT} highest priority features out of ${priorityFeatures.length} total priority features.` : ''}
      
      Product Context:
      - Name: ${brief.product_name}
      - Users: ${briefData.targetUsers}
      - Solution: ${briefData.proposedSolution}
      
      Features to document (${featuresForPRD.length} of ${priorityFeatures.length} total priority features):
      ${featuresForPRD.map((f, i) => `${i+1}. ${f.name}: ${f.description} (${f.priority.toUpperCase()})`).join('\n')}
      
      It is extremely important that you break down each feature into ONE OR MORE user stories and create a SEPARATE SECTION for each user story.
      
      Follow this exact template for your response. Create one section in the sections array for EACH combination of a feature and a single user story:
      
      {
        "sections": [
          {
            "featureId": "unique-id-for-feature",
            "featureName": "Feature Name - User Story Name",
            "originalFeatureName": "Feature Name",
            "featurePriority": "must or should",
            "userStoryName": "Short descriptive name for this user story",
            "overview": {
              "purpose": "Job to be done, what this specific user story solves and how",
              "successMetrics": ["North Star Metric"]
            },
            "userStory": "Detailed description for this specific user story",
            "acceptanceCriteria": {
              "guidelines": "Brief guidelines specific to this user story",
              "criteria": ["Criterion 1", "Criterion 2"]
            },
            "useCases": [
              {
                "id": "UC-id",
                "title": "Use case title",
                "description": "Brief description",
                "actors": ["describe user 1", "describe user 2"],
                "preconditions": ["Precondition 1"],
                "postconditions": ["Postcondition 1"],
                "mainScenario": ["Step 1", "Step 2"],
                "alternateFlows": [{"name": "Flow name", "steps": ["Step 1", "Step 2"]}],
                "exceptions": [{"name": "Exception name", "steps": ["Step 1", "Step 2"]}]
              }
            ],
            "nonFunctionalRequirements": {
              "performance": ["Requirement 1"],
              "security": ["Requirement 1"],
              "scalability": ["Requirement 1"],
              "usability": ["Requirement 1"],
              "reliability": ["Requirement 1"]
            },
            "dependencies": {
              "dependencies": ["Dependency 1"],
              "assumptions": ["Assumption 1"]
            },
            "openQuestions": {
              "questions": ["Question 1"],
              "risks": ["Risk 1"],
              "mitigations": ["Mitigation 1"]
            },
            "wireframeGuidelines": ["Guideline 1"]
          }
        ]
      }
      
      IMPORTANT INSTRUCTIONS:
      1. For each feature, create MULTIPLE SECTIONS (one per user story) in the JSON output
      2. The "featureId" field should be the same for all user stories of the same feature but each section should have a unique combination of feature and user story
      3. The "featureName" field should combine the feature name and user story name like "Feature Name - User Story Name"
      4. The "originalFeatureName" field should contain just the feature name for grouping
      5. The "userStoryName" field should provide a short descriptive name for the specific user story
      6. The "userStory" field should contain a SINGLE detailed user story (not an array)
      7. All other requirements (acceptance criteria, use cases, etc.) should be specific to this particular user story
      
      The output must be valid JSON with a "sections" array containing one object per feature+user story combination.
      
      Note: If there are more than ${featuresForPRD.length} features, only generate PRDs for the first ${featuresForPRD.length} features listed above.
    `;
    
    const response = await callOpenAI(prompt);
    
    // If there are more features than we processed, add a note in the response
    if (priorityFeatures.length > featuresForPRD.length) {
      try {
        const parsedResponse = JSON.parse(response);
        parsedResponse._note = `Note: Only the first ${featuresForPRD.length} of ${priorityFeatures.length} priority features were processed due to system limitations. For best results, consider processing features in smaller batches.`;
        return JSON.stringify(parsedResponse, null, 2);
      } catch (e) {
        // If parsing fails, just return the original response
        return response;
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error generating PRD:', error);
    throw new Error('Failed to generate PRD. Please try again.');
  }
}

export function parsePRD(rawContent: string): GeneratedPRD {
  try {
    // First attempt: direct JSON parse
    let parsedData;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (e) {
      console.log('Initial JSON parse failed, attempting cleanup...');
      
      // Second attempt: Clean up common JSON issues
      let cleanedContent = rawContent
        .replace(/}\s*{/g, '},{')
        .replace(/]\s*\[/g, '],[')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      try {
        parsedData = JSON.parse(cleanedContent);
      } catch (e2) {
        console.log('Cleaned JSON parse failed, attempting extraction...');
        
        // Third attempt: Extract JSON using regex
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (e3) {
            console.log('JSON extraction failed:', e3);
            return createDefaultPRDStructure(rawContent);
          }
        } else {
          return createDefaultPRDStructure(rawContent);
        }
      }
    }

    // Check if the parsed data is already in GeneratedPRD format
    if (parsedData.sections && Array.isArray(parsedData.sections)) {
      return {
        sections: parsedData.sections.map(validateAndFixSection)
      };
    }

    // If we can't determine the format, create a default structure
    console.warn('Unknown PRD format, creating default structure');
    return createDefaultPRDStructure(rawContent);
  } catch (error) {
    console.error('Error in parsePRD:', error);
    return createErrorPRDStructure();
  }
}

// Helper function to validate and fix a section structure
function validateAndFixSection(section: any): PRDSection {
  // Handle both old format (userStories array) and new format (userStory string)
  let userStories = ["As a user, I want to use this feature"];
  
  if (Array.isArray(section.userStories)) {
    // Old format - already an array
    userStories = section.userStories;
  } else if (section.userStory) {
    // New format - single string, convert to array
    userStories = [section.userStory];
  }
  
  // Create a valid section with defaults for missing properties
  return {
    featureName: section.featureName || "Unnamed Feature",
    featurePriority: section.featurePriority || "must",
    // Store new fields for UI display but maintain backward compatibility
    // These will be ignored by old code but used by new code
    originalFeatureName: section.originalFeatureName || section.featureName || "Unnamed Feature",
    featureId: section.featureId || `feature-${Math.random().toString(36).substring(2, 11)}`,
    userStoryName: section.userStoryName || "Main User Story",
    overview: {
      purpose: section.overview?.purpose || "No purpose specified",
      successMetrics: Array.isArray(section.overview?.successMetrics) 
        ? section.overview.successMetrics 
        : ["Adoption rate", "User satisfaction"]
    },
    userStories: userStories,
    acceptanceCriteria: {
      guidelines: section.acceptanceCriteria?.guidelines || "The feature should be intuitive and responsive",
      criteria: Array.isArray(section.acceptanceCriteria?.criteria) 
        ? section.acceptanceCriteria.criteria 
        : ["Feature should be functional", "Feature should be user-friendly"]
    },
    useCases: Array.isArray(section.useCases) && section.useCases.length > 0
      ? section.useCases.map(uc => ({
          id: uc.id || "UC-1",
          title: uc.title || "Use Case",
          description: uc.description || "User interacts with the feature",
          actors: Array.isArray(uc.actors) ? uc.actors : ["User", "System"],
          preconditions: Array.isArray(uc.preconditions) ? uc.preconditions : ["User is authenticated"],
          postconditions: Array.isArray(uc.postconditions) ? uc.postconditions : ["Action is completed"],
          mainScenario: Array.isArray(uc.mainScenario) ? uc.mainScenario : ["User performs action", "System responds"],
          alternateFlows: Array.isArray(uc.alternateFlows) ? uc.alternateFlows.map(flow => ({
            name: flow.name || "Alternative Flow",
            steps: Array.isArray(flow.steps) ? flow.steps : ["Alternative step"]
          })) : [{
            name: "Error Handling",
            steps: ["System detects error", "User is notified"]
          }],
          exceptions: Array.isArray(uc.exceptions) ? uc.exceptions.map(exception => ({
            name: exception.name || "Exception",
            steps: Array.isArray(exception.steps) ? exception.steps : ["Exception handling step"]
          })) : [{
            name: "System Error",
            steps: ["System logs error", "User sees friendly message"]
          }]
        }))
      : [{
          id: "UC-1",
          title: "Main Use Case",
          description: "User interacts with the feature",
          actors: ["User", "System"],
          preconditions: ["User is authenticated"],
          postconditions: ["Action is completed"],
          mainScenario: ["User performs action", "System responds"],
          alternateFlows: [{
            name: "Error Handling",
            steps: ["System detects error", "User is notified"]
          }],
          exceptions: [{
            name: "System Error",
            steps: ["System logs error", "User sees friendly message"]
          }]
        }],
    nonFunctionalRequirements: {
      performance: Array.isArray(section.nonFunctionalRequirements?.performance) 
        ? section.nonFunctionalRequirements.performance 
        : ["Load time < 2s", "Response time < 1s"],
      security: Array.isArray(section.nonFunctionalRequirements?.security) 
        ? section.nonFunctionalRequirements.security 
        : ["Data encryption at rest", "Secure authentication"],
      scalability: Array.isArray(section.nonFunctionalRequirements?.scalability) 
        ? section.nonFunctionalRequirements.scalability 
        : ["Support 1000 concurrent users", "Horizontal scaling"],
      usability: Array.isArray(section.nonFunctionalRequirements?.usability) 
        ? section.nonFunctionalRequirements.usability 
        : ["Mobile responsive", "Accessible design"],
      reliability: Array.isArray(section.nonFunctionalRequirements?.reliability) 
        ? section.nonFunctionalRequirements.reliability 
        : ["99.9% uptime", "Automatic failover"],
      ...(Array.isArray(section.nonFunctionalRequirements?.other) 
        ? { other: section.nonFunctionalRequirements.other } 
        : {})
    },
    dependencies: {
      dependencies: Array.isArray(section.dependencies?.dependencies) 
        ? section.dependencies.dependencies 
        : ["Authentication system", "Database"],
      assumptions: Array.isArray(section.dependencies?.assumptions) 
        ? section.dependencies.assumptions 
        : ["Modern browser support", "Stable internet connection"]
    },
    openQuestions: {
      questions: Array.isArray(section.openQuestions?.questions) 
        ? section.openQuestions.questions 
        : ["Integration timeline?", "Performance impact?"],
      risks: Array.isArray(section.openQuestions?.risks) 
        ? section.openQuestions.risks 
        : ["Technical debt", "User adoption"],
      mitigations: Array.isArray(section.openQuestions?.mitigations) 
        ? section.openQuestions.mitigations 
        : ["Regular reviews", "User feedback loops"]
    },
    wireframeGuidelines: Array.isArray(section.wireframeGuidelines) 
      ? section.wireframeGuidelines 
      : ["Mobile-first design", "Clear navigation", "Consistent styling"]
  };
}

// Helper function to create a default PRD structure with raw content
function createDefaultPRDStructure(rawContent: string): GeneratedPRD {
  return {
    sections: [{
      featureName: "Main Product",
      featurePriority: "must",
      overview: {
        purpose: "Generated PRD content",
        successMetrics: ["Adoption rate", "User satisfaction"]
      },
      userStories: ["As a user, I want to use the product to solve my problems"],
      acceptanceCriteria: {
        guidelines: "The feature should meet all requirements",
        criteria: ["Product should be functional", "Product should be user-friendly"]
      },
      useCases: [{
        id: "UC-1",
        title: "Main Use Case",
        description: "User interacts with the product",
        actors: ["User", "System"],
        preconditions: ["User is authenticated"],
        postconditions: ["Action is completed"],
        mainScenario: ["User opens the product", "User performs actions", "System responds"],
        alternateFlows: [{
          name: "Error Handling",
          steps: ["System detects error", "User is notified"]
        }],
        exceptions: [{
          name: "System Error",
          steps: ["System logs error", "User sees friendly message"]
        }]
      }],
      nonFunctionalRequirements: {
        performance: ["Load time < 2s", "Response time < 1s"],
        security: ["Data encryption at rest", "Secure authentication"],
        scalability: ["Support 1000 concurrent users", "Horizontal scaling"],
        usability: ["Mobile responsive", "Accessible design"],
        reliability: ["99.9% uptime", "Automatic failover"]
      },
      dependencies: {
        dependencies: ["Authentication system", "Database"],
        assumptions: ["Modern browser support", "Stable internet connection"]
      },
      openQuestions: {
        questions: ["Integration timeline?", "Performance impact?"],
        risks: ["Technical debt", "User adoption"],
        mitigations: ["Regular reviews", "User feedback loops"]
      },
      wireframeGuidelines: [
        "Mobile-first design",
        "Clear navigation",
        "Consistent styling"
      ]
    }]
  };
}

// Helper function to create an error PRD structure
function createErrorPRDStructure(): GeneratedPRD {
  return {
    sections: [{
      featureName: "Error in PRD Generation",
      featurePriority: "must",
      overview: {
        purpose: "An error occurred while generating the PRD",
        successMetrics: ["Fix the error"]
      },
      userStories: ["As a developer, I want to fix the PRD generation"],
      acceptanceCriteria: {
        guidelines: "Fix the error",
        criteria: ["PRD generation works correctly"]
      },
      useCases: [{
        id: "UC-1",
        title: "Error Case",
        description: "Error in PRD generation",
        actors: ["Developer"],
        preconditions: ["Error exists"],
        postconditions: ["Error is fixed"],
        mainScenario: ["Identify error", "Fix error", "Test solution"],
        alternateFlows: [{
          name: "Alternative",
          steps: ["Create workaround"]
        }],
        exceptions: [{
          name: "Exception",
          steps: ["Document the issue"]
        }]
      }],
      nonFunctionalRequirements: {
        performance: ["Fix quickly"],
        security: ["Maintain security"],
        scalability: ["Ensure scalability"],
        usability: ["Keep usable"],
        reliability: ["Improve reliability"]
      },
      dependencies: {
        dependencies: ["Debugging tools"],
        assumptions: ["Error is fixable"]
      },
      openQuestions: {
        questions: ["What caused the error?"],
        risks: ["Recurring issues"],
        mitigations: ["Thorough testing"]
      },
      wireframeGuidelines: [
        "Maintain design integrity"
      ]
    }]
  };
} 