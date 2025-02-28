import { Brief } from './briefStore';
import { Feature } from './featureStore';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

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

export async function generateFeatures(brief: Brief): Promise<Feature[]> {
  const prompt = `Based on the following product brief, generate a list of features using the MoSCoW prioritization framework (Must have, Should have, Could have, Won't have). For each feature, also assess its difficulty level (easy, medium, hard) based on implementation complexity.

Product Brief:
${brief.productName}
${brief.problemStatement}

Target Users: ${brief.targetUsers}
Problem Statement: ${brief.problemStatement}
Product Objectives: ${brief.productObjectives}

Format each feature as a JSON object with:
- name: short feature name
- description: detailed description
- priority: one of ["must", "should", "could", "wont"]
- difficulty: one of ["easy", "medium", "hard"]

Return the features as a JSON array.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No content received from OpenAI');
    }

    const features = JSON.parse(response);
    if (!Array.isArray(features)) {
      throw new Error('Invalid response format: expected an array of features');
    }

    return features.map((feature: any) => ({
      id: uuidv4(),
      briefId: brief.id,
      name: feature.name || '',
      description: feature.description || '',
      priority: feature.priority || 'could',
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
        name: feature.name,
        description: feature.description,
        priority,
        difficulty: feature.difficulty || 'medium', // Add default difficulty if not provided
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