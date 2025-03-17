import { Brief } from './briefStore';
import { Feature } from './featureStore';
import { v4 as uuidv4 } from 'uuid';
import { generateFeaturesWithAI } from './openAIClient';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for testing purposes.');
}

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

export async function generateFeatures(brief: Brief): Promise<Feature[]> {
  if (USE_MOCK) {
    const mockResponse = generateMockFeatures(brief);
    try {
      const parsed = JSON.parse(mockResponse);
      const allFeatures = [
        ...parsed.features.must,
        ...parsed.features.should,
        ...parsed.features.could,
        ...parsed.features.wont
      ];
      
      return allFeatures.map((feature: any) => ({
        id: uuidv4(),
        briefId: brief.id,
        title: feature.name || '',
        name: feature.name || '',
        description: feature.description || '',
        priority: (feature.priority === 'must' || feature.priority === 'should' || feature.priority === 'could' || feature.priority === 'wont') ? feature.priority : 'could',
        difficulty: feature.difficulty || 'medium',
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error parsing mock features:', error);
      throw new Error('Failed to parse mock features');
    }
  }

  const prompt = `Based on the following product brief, generate a list of features using the MoSCoW prioritization framework (Must have, Should have, Could have, Won't have). For each feature, also assess its difficulty level (easy, medium, hard) based on implementation complexity from a UX design and software development point of view.

Product Brief:
${brief.productName}
${brief.problemStatement}

Target Users: ${brief.targetUsers}
Problem Statement: ${brief.problemStatement}
Product Objectives: ${brief.productObjectives}

Always add profile features as could priority (login/signup, profile, settings).

Format your response as a valid JSON array of features. Each feature should be a JSON object with:
- name: short feature name
- description: detailed description
- priority: one of ["must", "should", "could", "wont"]
- difficulty: one of ["easy", "medium", "hard"]

IMPORTANT: Your entire response must be a valid JSON array that can be parsed with JSON.parse().
Example format:
[
  {
    "name": "Feature Name",
    "description": "Feature description",
    "priority": "must",
    "difficulty": "medium"
  },
  ...
]`;

  try {
    // Use the specialized method for feature generation
    const response = await generateFeaturesWithAI(prompt);
    if (!response) {
      throw new Error('No content received from OpenAI');
    }

    // Extract JSON from the response
    let jsonString = response.trim();
    
    // Remove markdown code block indicators if present
    if (jsonString.includes('```json')) {
      jsonString = jsonString.replace(/```json\n|\n```/g, '');
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```\n|\n```/g, '');
    }
    
    // Find the first { or [ and the last } or ]
    const firstBrace = Math.min(
      jsonString.indexOf('{') >= 0 ? jsonString.indexOf('{') : Number.MAX_SAFE_INTEGER,
      jsonString.indexOf('[') >= 0 ? jsonString.indexOf('[') : Number.MAX_SAFE_INTEGER
    );
    
    const lastBrace = Math.max(
      jsonString.lastIndexOf('}'),
      jsonString.lastIndexOf(']')
    );
    
    if (firstBrace !== Number.MAX_SAFE_INTEGER && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let features;
    try {
      features = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response was:', jsonString);
      throw new Error('Failed to parse the response as JSON');
    }

    // Handle both array format and object with features property
    if (features.features) {
      // Handle the case where the response is in the format { features: [...] }
      features = features.features;
    } else if (!Array.isArray(features)) {
      // If it's an object but not in the expected format, try to extract features
      if (features.must || features.should || features.could || features.wont) {
        features = [
          ...(features.must || []),
          ...(features.should || []),
          ...(features.could || []),
          ...(features.wont || [])
        ];
      } else {
        throw new Error('Invalid response format: expected an array of features or a features object');
      }
    }

    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('Invalid response format: expected a non-empty array of features');
    }

    return features.map((feature: any) => ({
      id: uuidv4(),
      briefId: brief.id,
      title: feature.name || '',
      name: feature.name || '',
      description: feature.description || '',
      priority: (feature.priority === 'must' || feature.priority === 'should' || feature.priority === 'could' || feature.priority === 'wont') ? feature.priority : 'could',
      difficulty: feature.difficulty || 'medium',
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error generating features:', error);
    throw new Error('Failed to generate features. Please try again.');
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
        title: feature.name || '',
        name: feature.name,
        description: feature.description,
        priority,
        difficulty: feature.difficulty || 'medium',
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