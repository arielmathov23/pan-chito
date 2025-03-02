import OpenAI from 'openai';

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  console.warn('OpenAI API key is not set. Set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  dangerouslyAllowBrowser: true
});

export async function callOpenAI(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an experienced product manager and strategic designer with a lot of experience in technology tasked to create detailed info about a product. When generating a response, follow the exact template provided and ensure the output is valid JSON. Be concise but comprehensive, focusing on the most important aspects of each task."
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
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate content. Please check your OpenAI API key and try again.');
  }
}

/**
 * Specialized method for generating features with OpenAI
 * Uses a specific system prompt and response format optimized for feature generation
 */
export async function generateFeaturesWithAI(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a feature generator that only outputs valid JSON arrays. Never include explanatory text in your response."
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
    console.error('Error generating features with OpenAI:', error);
    throw new Error('Failed to generate features. Please check your OpenAI API key and try again.');
  }
} 