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
          content: "You are a helpful assistant that provides detailed and structured responses."
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