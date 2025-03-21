import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

// Define types for screen and results
interface Screen {
  id: string;
  name: string;
  description: string;
  featureId?: string;
  elements: any[];
}

interface SuccessfulResult {
  screenId: string;
  svg: string;
}

interface FailedResult {
  screenId: string;
  error: string;
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { screens, prd } = req.body;

    if (!screens || !Array.isArray(screens) || screens.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing screens data' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
    }

    console.log(`Generating SVG wireframes for ${screens.length} screens`);
    console.log(`Screen IDs being processed: ${screens.map(s => s.id).join(', ')}`);

    // Format PRD content for better AI context
    const formattedPrd = formatPrdForPrompt(prd);

    // Generate SVGs for all screens in parallel with a timeout
    const results = await Promise.allSettled(
      screens.map(async (screen: Screen) => {
        try {
          console.log(`Starting SVG generation for screen: ${screen.id} (${screen.name})`);
          
          // Set up AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

          // Prepare detailed prompt for Claude
          const prompt = `
You are a UX design expert specializing in mobile interface wireframing. Generate a comprehensive, low-fidelity SVG wireframe for this mobile app screen:

SCREEN NAME: ${screen.name}
DESCRIPTION: ${screen.description}
FEATURE ID: ${screen.featureId || 'Not specified'}

APPLICATION CONTEXT:
${formattedPrd}

UI REQUIREMENTS:
${JSON.stringify(screen.elements, null, 2)}

DESIGN GUIDELINES:
1. Create a low-fidelity well desing wireframe with ultimate desing trends, focused on layout and UX.
2. Use standard wireframe styles (grayscale, simple shapes, minimal design)
3. Set SVG viewport to 360x640 with preserveAspectRatio="xMidYMid meet" 
4. Follow mobile UI best practices with appropriate spacing, including structural components, and touch targets
5. Clearly represent each element type (buttons, inputs, text, images). Be as much specific sa you can be.
6. Show visual hierarchy through size, positioning, and grouping
7. Ensure proper alignment and consistency across elements

TECHNICAL REQUIREMENTS:
1. Return ONLY valid SVG code
2. Use appropriate text sizes (14-16px for body text)
3. Include all elements from the UI requirements section, and
4. Create a responsive design that works on various screen sizes
5. Use semantic grouping of elements in the SVG structure
6. Use appropriate ARIA attributes for accessibility
7. Keep the SVG as compact as possible for performance
8. Ensure all important content is visible without requiring scrolling

Your response must start with <svg and end with </svg> tags with no other content.`;

          // Call Claude API with the timeout
          const message = await anthropic.messages.create({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 4000,
            temperature: 0.1,
            system: "You are an expert UI/UX designer specializing in creating SVG wireframes. You will only respond with valid SVG code, no explanations.",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          }, { signal: controller.signal }).catch(err => {
            clearTimeout(timeoutId);
            console.error(`API error for screen ${screen.id}:`, err);
            throw err;
          });

          clearTimeout(timeoutId);

          // Extract SVG content from Claude's response
          let svgContent = '';
          if (message.content && message.content.length > 0 && 'text' in message.content[0]) {
            const content = message.content[0].text;
            const svgMatch = content.match(/<svg[\s\S]*<\/svg>/);
            
            if (svgMatch) {
              svgContent = svgMatch[0];
              console.log(`Successfully generated SVG for screen ${screen.id} (${svgContent.length} characters)`);
            } else {
              console.error(`Failed to extract SVG from Claude response for screen ${screen.id}`);
              throw new Error('Failed to extract SVG from Claude response');
            }
          } else {
            console.error(`Invalid response format from Claude API for screen ${screen.id}`);
            throw new Error('Invalid response format from Claude API');
          }

          return {
            screenId: screen.id,
            svg: svgContent
          } as SuccessfulResult;
        } catch (err: any) {
          console.error(`Error generating SVG for screen ${screen.id}:`, err);
          throw err;
        }
      })
    );

    // Process results and identify which screens succeeded/failed
    const successful: SuccessfulResult[] = [];
    const failed: FailedResult[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          screenId: screens[index].id,
          error: result.reason.message || 'Unknown error'
        });
      }
    });

    console.log(`SVG generation complete. Success: ${successful.length}, Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log(`Failed screen IDs: ${failed.map(f => f.screenId).join(', ')}`);
    }

    return res.status(200).json({
      successful,
      failed,
      totalRequested: screens.length,
      totalSuccessful: successful.length,
      totalFailed: failed.length
    });
  } catch (error: any) {
    console.error('Error in generate-svg-wireframes API:', error);
    return res.status(500).json({
      error: 'Failed to generate wireframes',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Function to format PRD content for the prompt
function formatPrdForPrompt(prd: any): string {
  if (!prd) return 'No PRD content available';
  
  let prdText = '';
  
  // Handle string PRD content
  if (typeof prd === 'string') {
    prdText = prd;
  } 
  // Handle object PRD content
  else if (typeof prd === 'object') {
    try {
      // Try to extract the most relevant fields
      const { productName, problemStatement, targetAudience, keyFeatures, userStories } = prd;
      
      prdText = [
        productName ? `PRODUCT: ${productName}` : '',
        problemStatement ? `PROBLEM: ${problemStatement}` : '',
        targetAudience ? `AUDIENCE: ${targetAudience}` : '',
        keyFeatures ? `KEY FEATURES: ${Array.isArray(keyFeatures) ? keyFeatures.join(', ') : keyFeatures}` : '',
        userStories ? `USER STORIES: ${Array.isArray(userStories) ? userStories.join('\n') : userStories}` : ''
      ].filter(Boolean).join('\n');
      
      // If we couldn't extract specific fields, stringify the whole object
      if (!prdText) {
        prdText = JSON.stringify(prd, null, 2);
      }
    } catch (error) {
      // Fallback to stringifying the entire object
      prdText = JSON.stringify(prd, null, 2);
    }
  }
  
  // Limit PRD text to a reasonable length (Claude has a token limit)
  const maxLength = 800;
  if (prdText.length > maxLength) {
    prdText = prdText.substring(0, maxLength) + '...';
  }
  
  return prdText;
} 