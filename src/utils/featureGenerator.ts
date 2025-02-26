import { Brief } from './briefStore';
import { Feature } from './featureStore';
import OpenAI from 'openai';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for testing purposes.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error, will fail on actual API call
  dangerouslyAllowBrowser: true
});

export interface GeneratedFeatureSet {
  features: {
    must: Feature[];
    should: Feature[];
    could: Feature[];
    wont: Feature[];
  };
  keyQuestions: string[];
}

// Mock implementation for testing purposes
function generateMockFeatures(brief: Brief): string {
  return JSON.stringify({
    "features": {
      "must": [
        {
          "name": "User Authentication",
          "description": "Allow users to create accounts, log in, and manage their profiles",
          "priority": "must"
        },
        {
          "name": "Core Functionality",
          "description": `Primary feature related to ${brief.productName}`,
          "priority": "must"
        }
      ],
      "should": [
        {
          "name": "User Dashboard",
          "description": "Personalized dashboard showing user activity and recommendations",
          "priority": "should"
        }
      ],
      "could": [
        {
          "name": "Social Sharing",
          "description": "Allow users to share content on social media platforms",
          "priority": "could"
        }
      ],
      "wont": [
        {
          "name": "Advanced Analytics",
          "description": "Comprehensive analytics and reporting features for users",
          "priority": "wont"
        }
      ]
    },
    "keyQuestions": [
      "What authentication methods should be supported?",
      "What are the security requirements for user data?",
      "What metrics will be used to measure success?"
    ]
  });
}

export async function generateFeatures(brief: Brief): Promise<string> {
  const briefData = brief.briefData;
  
  // Create a comprehensive brief summary for the AI
  const briefSummary = `
Product Name: ${brief.productName}

Executive Summary: ${briefData.executiveSummary}

Problem Statement: ${briefData.problemStatement}

Target Users: ${briefData.targetUsers}

Existing Solutions: ${briefData.existingSolutions}

Proposed Solution: ${briefData.proposedSolution}

Product Objectives: ${briefData.productObjectives}

Key Features: ${briefData.keyFeatures}

${briefData.marketAnalysis ? `Market Analysis: ${briefData.marketAnalysis}` : ''}

${briefData.technicalRisks ? `Technical Risks: ${briefData.technicalRisks}` : ''}

${briefData.businessRisks ? `Business Risks: ${briefData.businessRisks}` : ''}

${briefData.implementationStrategy ? `Implementation Strategy: ${briefData.implementationStrategy}` : ''}

${briefData.successMetrics ? `Success Metrics: ${briefData.successMetrics}` : ''}
`;

  const prompt = `Based on this brief:

${briefSummary}

Generate a list of key features and technical requirements for building this MVP.

First ideate on which features will add more value, and then define the list of features for the MVP using the MoSCoW framework to categorize based on their importance for the MVP, ensuring a fast and focused release.

Then refine and define MVP features to create a solid and valuable product that can be released in no more than 3 months with a small team of developers and designers.

Please take into account that user stories are not necessary for this instance.

Finally, please make a list of key questions to respond to before starting the implementation.

Format your response as a JSON object with the following structure:
{
  "features": {
    "must": [
      {
        "name": "Feature name",
        "description": "Detailed description of the feature",
        "priority": "must"
      }
    ],
    "should": [
      {
        "name": "Feature name",
        "description": "Detailed description of the feature",
        "priority": "should"
      }
    ],
    "could": [
      {
        "name": "Feature name",
        "description": "Detailed description of the feature",
        "priority": "could"
      }
    ],
    "wont": [
      {
        "name": "Feature name",
        "description": "Detailed description of the feature",
        "priority": "wont"
      }
    ]
  },
  "keyQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}`;

  try {
    // Use mock implementation if API key is missing
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateMockFeatures(brief);
    }

    if (!apiKey) {
      throw new Error('OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.');
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional product manager who specializes in feature prioritization and MVP planning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating features:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to generate features. Please check your OpenAI API key or try again later.');
    }
  }
}

export function parseGeneratedFeatures(jsonString: string, briefId: string): GeneratedFeatureSet {
  try {
    // Clean the response if it contains markdown code blocks
    let cleanedJsonString = jsonString;
    
    // Remove markdown code block indicators if present
    if (cleanedJsonString.includes('```json')) {
      cleanedJsonString = cleanedJsonString.replace(/```json\n|\n```/g, '');
    } else if (cleanedJsonString.includes('```')) {
      cleanedJsonString = cleanedJsonString.replace(/```\n|\n```/g, '');
    }
    
    // Trim any whitespace
    cleanedJsonString = cleanedJsonString.trim();
    
    const parsed = JSON.parse(cleanedJsonString);
    
    // Add IDs and briefId to each feature
    const processFeatures = (features: any[], priority: 'must' | 'should' | 'could' | 'wont'): Feature[] => {
      return features.map(feature => ({
        id: crypto.randomUUID(),
        briefId,
        name: feature.name,
        description: feature.description,
        priority,
        createdAt: new Date().toISOString()
      }));
    };
    
    return {
      features: {
        must: processFeatures(parsed.features.must, 'must'),
        should: processFeatures(parsed.features.should, 'should'),
        could: processFeatures(parsed.features.could, 'could'),
        wont: processFeatures(parsed.features.wont, 'wont')
      },
      keyQuestions: parsed.keyQuestions
    };
  } catch (error) {
    console.error('Error parsing generated features:', error);
    throw new Error('Failed to parse the generated features. Please try again.');
  }
} 