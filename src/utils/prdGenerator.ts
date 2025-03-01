import { Brief } from '../services/briefService';
import { FeatureSet } from './featureStore';
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
    other: string[];
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
        successMetrics: ['Adoption rate', 'User satisfaction', 'System performance']
      },
      userStories: [
        `As a user, I want to ${feature.description.toLowerCase()} so that I can be more productive`,
        `As an admin, I want to monitor ${feature.name.toLowerCase()} usage so that I can optimize the system`
      ],
      acceptanceCriteria: {
        guidelines: 'The feature should be intuitive and responsive',
        criteria: [
          'Feature should load within 2 seconds',
          'All actions should have clear feedback',
          'Error states should be handled gracefully'
        ]
      },
      useCases: [{
        id: `UC-${index + 1}`,
        title: `Use ${feature.name}`,
        description: `User interacts with ${feature.name} functionality`,
        actors: ['User', 'System'],
        preconditions: ['User is authenticated', 'System is online'],
        postconditions: ['Action is completed', 'Data is updated'],
        mainScenario: [
          'User navigates to feature',
          'User performs action',
          'System processes request',
          'System confirms success'
        ],
        alternateFlows: [{
          name: 'Error Handling',
          steps: ['System detects error', 'User is notified', 'User can retry']
        }],
        exceptions: [{
          name: 'System Unavailable',
          steps: ['System logs error', 'User sees friendly message']
        }]
      }],
      nonFunctionalRequirements: {
        performance: ['Load time < 2s', 'Response time < 1s'],
        security: ['Data encryption at rest', 'Secure authentication'],
        scalability: ['Support 1000 concurrent users', 'Horizontal scaling'],
        usability: ['Mobile responsive', 'Accessible design'],
        reliability: ['99.9% uptime', 'Automatic failover'],
        other: ['Multi-language support', 'Dark mode support']
      },
      dependencies: {
        dependencies: ['Authentication system', 'Database'],
        assumptions: ['Modern browser support', 'Stable internet connection']
      },
      openQuestions: {
        questions: ['Integration timeline?', 'Performance impact?'],
        risks: ['Technical debt', 'User adoption'],
        mitigations: ['Regular reviews', 'User feedback loops']
      },
      wireframeGuidelines: [
        'Mobile-first design',
        'Clear navigation',
        'Consistent styling'
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
    const features = featureSet.features;
    
    const prompt = `
      You are a product manager tasked with creating a Product Requirements Document (PRD) for a new product.
      
      Here's information about the product from the brief:
      
      Product Name: ${brief.product_name}
      Problem Statement: ${briefData.problemStatement}
      Target Users: ${briefData.targetUsers}
      Proposed Solution: ${briefData.proposedSolution}
      Product Objectives: ${briefData.productObjectives}
      Key Features: ${briefData.keyFeatures}
      
      Here are the features that have been selected for implementation:
      ${features.map(f => `- ${f.title}: ${f.description}`).join('\n')}
      
      Please create a comprehensive PRD in JSON format with the following sections:
      
      {
        "overview": "A high-level overview of the product",
        "userStories": "User stories for the main features",
        "requirements": "Functional and non-functional requirements",
        "architecture": "High-level system architecture",
        "dataModel": "Data model and database schema",
        "api": "API endpoints and specifications",
        "userInterface": "UI/UX guidelines and wireframes description",
        "implementation": "Implementation details and considerations",
        "testing": "Testing strategy and test cases",
        "deployment": "Deployment strategy and considerations",
        "timeline": "Project timeline and milestones",
        "risks": "Potential risks and mitigation strategies",
        "appendix": "Additional information and references"
      }
      
      Make sure the PRD is detailed, comprehensive, and follows best practices for software product development.
      The output should be valid JSON that can be parsed.
    `;
    
    const response = await callOpenAI(prompt);
    return response;
  } catch (error) {
    console.error('Error generating PRD:', error);
    throw new Error('Failed to generate PRD. Please try again.');
  }
}

export function parsePRD(prdContent: string): GeneratedPRD {
  try {
    // First parse as PRD
    const prdData = JSON.parse(prdContent) as PRD;
    
    // Convert to GeneratedPRD format
    return {
      sections: [{
        featureName: "Main Product",
        featurePriority: "must",
        overview: {
          purpose: prdData.overview,
          successMetrics: ["Adoption rate", "User satisfaction"]
        },
        userStories: prdData.userStories.split("\n").filter(Boolean),
        acceptanceCriteria: {
          guidelines: "The feature should meet all requirements",
          criteria: prdData.requirements.split("\n").filter(Boolean)
        },
        useCases: [{
          id: "UC-1",
          title: "Main Use Case",
          description: prdData.overview,
          actors: ["User", "System"],
          preconditions: ["User is authenticated"],
          postconditions: ["Action is completed"],
          mainScenario: prdData.implementation.split("\n").filter(Boolean),
          alternateFlows: [{
            name: "Error Handling",
            steps: ["System detects error", "User is notified"]
          }],
          exceptions: [{
            name: "System Unavailable",
            steps: ["System logs error", "User sees friendly message"]
          }]
        }],
        nonFunctionalRequirements: {
          performance: prdData.architecture.split("\n").filter(Boolean),
          security: ["Data encryption at rest"],
          scalability: ["Support for multiple users"],
          usability: prdData.userInterface.split("\n").filter(Boolean),
          reliability: ["99.9% uptime"],
          other: []
        },
        dependencies: {
          dependencies: prdData.dataModel.split("\n").filter(Boolean),
          assumptions: ["Modern browser support"]
        },
        openQuestions: {
          questions: ["Integration timeline?"],
          risks: prdData.risks.split("\n").filter(Boolean),
          mitigations: ["Regular reviews"]
        },
        wireframeGuidelines: prdData.userInterface.split("\n").filter(Boolean)
      }]
    };
  } catch (error) {
    console.error('Error parsing PRD JSON:', error);
    throw new Error('Failed to parse the generated PRD. Please try again.');
  }
} 