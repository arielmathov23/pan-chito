import { v4 as uuidv4 } from 'uuid';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { AppFlow, Screen, ScreenElement, FlowStep } from './screenStore';

// Function to generate screens using OpenAI
export async function generateScreens(brief: Brief, prd: PRD): Promise<{ screens: Screen[], appFlow: AppFlow }> {
  try {
    // Prepare a more concise prompt for OpenAI
    const prompt = `
Based on the following product brief and PRD, generate a user interface design specification in JSON format.

Product: ${brief.productName}
Problem: ${brief.briefData.problemStatement.slice(0, 300)}...
Users: ${brief.briefData.targetUsers.slice(0, 300)}...
Key Features: ${brief.briefData.keyFeatures.slice(0, 300)}...

Core PRD Content (Summary):
${JSON.stringify(prd.content).slice(0, 800)}...

Required Output Format:
{
  "appFlow": {
    "steps": [
      {
        "description": "string describing the step",
        "screenReference": "name of the screen this step refers to"
      }
    ]
  },
  "screens": [
    {
      "name": "string name of screen",
      "description": "string description",
      "elements": [
        {
          "type": "string type of element",
          "properties": {
            "key": "value"
          }
        }
      ]
    }
  ]
}

Focus on:
1. Essential screens only
2. Clear user flow
3. Core functionality (login/signup if needed)
4. Keep descriptions concise
5. Use simple element types (button, input, text, image)`;

    // Call OpenAI API with optimized parameters
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Full error response:', errorData);
      throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Full API response:', data);
      throw new Error('Invalid API response format');
    }

    const content = data.choices[0].message.content;
    
    // Ensure the content is valid JSON before parsing
    try {
      JSON.parse(content);
    } catch (error) {
      console.error('Invalid JSON in API response:', content);
      throw new Error('Invalid JSON response from API');
    }

    return parseScreenResponse(content, prd.id);
  } catch (error) {
    console.error('Error generating screens:', error);
    throw error;
  }
}

// Function to parse the OpenAI response
function parseScreenResponse(responseText: string, prdId: string): { screens: Screen[], appFlow: AppFlow } {
  try {
    // Parse the JSON response
    const parsedData = JSON.parse(responseText);
    
    // Create screens
    const screens: Screen[] = (parsedData.screens || []).map((screenData: any) => {
      return {
        id: uuidv4(),
        prdId,
        name: screenData.name || 'Unnamed Screen',
        description: screenData.description || '',
        elements: (screenData.elements || []).map((element: any) => {
          return {
            id: uuidv4(),
            type: element.type || 'unknown',
            properties: element.properties || {}
          } as ScreenElement;
        }),
        createdAt: Date.now()
      } as Screen;
    });
    
    // Create app flow
    const appFlow: AppFlow = {
      id: uuidv4(),
      prdId,
      steps: (parsedData.appFlow?.steps || []).map((step: any) => {
        // Find the screen ID if there's a reference
        let screenId: string | undefined = undefined;
        if (step.screenReference) {
          const referencedScreen = screens.find(s => s.name === step.screenReference);
          if (referencedScreen) {
            screenId = referencedScreen.id;
          }
        }
        
        return {
          id: uuidv4(),
          description: step.description || '',
          screenId
        } as FlowStep;
      }),
      createdAt: Date.now()
    };
    
    return { screens, appFlow };
  } catch (error) {
    console.error('Error parsing screen response:', error);
    throw new Error('Failed to parse the AI response. Please try again.');
  }
}

// Function to parse screens from a raw text response
export function parseScreens(responseText: string, prdId: string): { screens: Screen[], appFlow: AppFlow } {
  return parseScreenResponse(responseText, prdId);
} 