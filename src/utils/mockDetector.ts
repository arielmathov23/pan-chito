/**
 * Utility to detect if the application is using mock data instead of OpenAI integration
 */

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

/**
 * Checks if the application is using mock data instead of OpenAI integration
 * @returns boolean indicating if mock data is being used
 */
export const isMockData = (): boolean => {
  return !apiKey && typeof window !== 'undefined';
};

export default isMockData; 