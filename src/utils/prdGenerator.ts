import OpenAI from 'openai';
import { Brief } from './briefStore';
import { FeatureSet } from './featureStore';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for testing purposes.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  dangerouslyAllowBrowser: true
});

export interface PRDSection {
  featureName: string;
  featurePriority: 'must' | 'should' | 'could' | 'wont';
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

  // Filter for Must and Should features
  const priorityFeatures = featureSet.features.filter(
    feature => feature.priority === 'must' || feature.priority === 'should'
  );

  const prompt = `You are a PRD generation assistant. Your task is to create a detailed Product Requirements Document (PRD) based on the provided brief and feature list.
Please respond ONLY with a valid JSON object matching the exact structure below, with no additional text or explanation.

Brief:
${JSON.stringify(brief.briefData, null, 2)}

Features:
${JSON.stringify(priorityFeatures, null, 2)}

Required JSON Structure:
${JSON.stringify({
  sections: [{
    featureName: "string",
    featurePriority: "must or should",
    overview: {
      purpose: "string",
      successMetrics: ["string"]
    },
    userStories: ["string"],
    acceptanceCriteria: {
      guidelines: "string",
      criteria: ["string"]
    },
    useCases: [{
      id: "string",
      title: "string",
      description: "string",
      actors: ["string"],
      preconditions: ["string"],
      postconditions: ["string"],
      mainScenario: ["string"],
      alternateFlows: [{
        name: "string",
        steps: ["string"]
      }],
      exceptions: [{
        name: "string",
        steps: ["string"]
      }]
    }],
    nonFunctionalRequirements: {
      performance: ["string"],
      security: ["string"],
      scalability: ["string"],
      usability: ["string"],
      reliability: ["string"],
      other: ["string"]
    },
    dependencies: {
      dependencies: ["string"],
      assumptions: ["string"]
    },
    openQuestions: {
      questions: ["string"],
      risks: ["string"],
      mitigations: ["string"]
    },
    wireframeGuidelines: ["string"]
  }]
}, null, 2)}

Important:
1. Generate a detailed section for EACH of the provided features (all Must and Should priority features)
2. Each feature section should include the feature's priority (must or should) in the featurePriority field
3. Ensure each section is detailed and specific to the feature
4. Include realistic metrics, technical requirements, and clear acceptance criteria
5. Return ONLY the JSON object with no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a PRD generator that only outputs valid JSON matching the specified structure. Never include explanatory text in your response."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating PRD:', error);
    throw new Error('Failed to generate PRD. Please try again.');
  }
}

export function parsePRD(jsonString: string): GeneratedPRD {
  try {
    let cleanedJsonString = jsonString.trim();
    
    // Remove any potential markdown code block indicators
    if (cleanedJsonString.includes('```json')) {
      cleanedJsonString = cleanedJsonString.replace(/```json\n|\n```/g, '');
    } else if (cleanedJsonString.includes('```')) {
      cleanedJsonString = cleanedJsonString.replace(/```\n|\n```/g, '');
    }
    
    // Remove any text before the first { and after the last }
    const firstBrace = cleanedJsonString.indexOf('{');
    const lastBrace = cleanedJsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedJsonString = cleanedJsonString.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      const parsed = JSON.parse(cleanedJsonString);
      
      // Validate the structure
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid PRD structure: missing sections array');
      }
      
      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Failed to parse the generated PRD. The response was not valid JSON.');
    }
  } catch (error) {
    console.error('Error parsing PRD:', error);
    throw new Error('Failed to parse the generated PRD. Please try again.');
  }
} 