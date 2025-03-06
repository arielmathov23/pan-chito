import OpenAI from 'openai';
import { BriefFormData } from '../components/BriefForm';

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

// Debug log for API key detection
if (typeof window !== 'undefined') {
  console.log('API Key available:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('Using mock:', USE_MOCK);
}

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for testing purposes.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error, will fail on actual API call
  dangerouslyAllowBrowser: true
});

export interface GeneratedBrief {
  executiveSummary: string;
  problemStatement: string;
  targetUsers: string;
  existingSolutions: string;
  proposedSolution: string;
  productObjectives: string;
  keyFeatures: string;
  marketAnalysis: string;
  technicalRisks: string;
  businessRisks: string;
  implementationStrategy: string;
  successMetrics: string;
}

// Ensure all fields in the brief are strings
function ensureStringFields(brief: any): GeneratedBrief {
  const result: GeneratedBrief = {} as GeneratedBrief;
  
  for (const key of Object.keys(brief)) {
    const value = brief[key];
    if (typeof value === 'string') {
      result[key as keyof GeneratedBrief] = value;
    } else {
      // Convert non-string values to formatted strings
      result[key as keyof GeneratedBrief] = JSON.stringify(value, null, 2);
    }
  }
  
  return result;
}

// Mock implementation for testing purposes
function generateMockBrief(formData: BriefFormData): string {
  const briefData: GeneratedBrief = {
    executiveSummary: `${formData.productName} is a product designed to address the problem of ${formData.problemStatement.substring(0, 100)}...`,
    problemStatement: formData.problemStatement,
    targetUsers: formData.targetUsers,
    existingSolutions: formData.existingSolutions || `Current alternatives have limitations in terms of usability and effectiveness. Existing products don't fully address the core user needs. Our solution improves upon these by offering a more comprehensive approach.`,
    proposedSolution: `${formData.proposedSolution}\n\n**Platform Recommendation:** Based on the target users and use cases, we recommend developing this as a mobile app with a complementary web application. The mobile app will provide on-the-go access which is essential for the target users, while the web application will support more complex administrative tasks and data visualization.`,
    productObjectives: formData.productObjectives,
    keyFeatures: `Based on the ideas provided, we recommend prioritizing the following features for the MVP:\n\n${formData.keyFeatures}\n\nThese features align with the product objectives and address the core user needs.`,
    marketAnalysis: formData.marketAnalysis || `Market Size: Growing market with significant potential. Competition: Some existing solutions but with clear differentiation opportunities. Trends: Increasing demand for efficient solutions in this space.`,
    technicalRisks: `Based on the product description, potential technical risks include:\n\n1. Integration complexity with existing systems\n2. Scalability challenges as user base grows\n3. Data security and privacy concerns\n4. Performance optimization for real-time features\n5. Cross-platform compatibility issues`,
    businessRisks: `Based on the market analysis, potential business risks include:\n\n1. User adoption and engagement challenges\n2. Competitive pressure from established players\n3. Monetization strategy effectiveness\n4. Customer acquisition costs\n5. Regulatory compliance requirements`,
    implementationStrategy: `Phase 1: Core functionality development (2-3 months). Phase 2: Beta testing with selected users (1 month). Phase 3: Full launch with marketing campaign (1 month).`,
    successMetrics: `User adoption rate. User retention. Feature usage statistics. Customer satisfaction scores.`
  };

  return JSON.stringify(briefData, null, 2);
}

export async function generateBrief(formData: BriefFormData): Promise<string> {
  // Use mock implementation if API key is missing
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return generateMockBrief(formData);
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.');
  }

  const prompt = `You are the world's best strategist and product manager with an IQ of 180, and you're going to design an excellently defined product with all the necessary information for your product team to develop and design. Your task #1 is to create a structured brief for this product's MVP. Include market analysis, trends, and potential competitors. Include analysis of technical, commercial, and general risks, to be refined.

Create a detailed Product Brief based on the following information:

Product Name: ${formData.productName}

Problem Statement:
${formData.problemStatement}

Target Users:
${formData.targetUsers}

Existing Solutions:
${formData.existingSolutions}

Proposed General Solution:
${formData.proposedSolution}

Project Objectives:
${formData.productObjectives}

Ideas and Functionality to Explore:
${formData.keyFeatures}

Market trends:
${formData.marketAnalysis}

Technical Risks:
[Please identify and analyze potential technical risks based on the product description and ideas]

Business Risks:
[Please identify and analyze potential business risks based on the product description and market analysis]

Please provide your response as a JSON object with the following structure:
{
  "executiveSummary": "A brief and concise summary of the product",
  "problemStatement": "Detailed problem statement with data if possible",
  "targetUsers": "Clear segmentation and user profiles as a string, not an object",
  "existingSolutions": "Analysis of current alternatives and their limitations",
  "proposedSolution": "Detailed explanation of how the product solves the problem. IMPORTANT: Include a clear recommendation on the optimal platform type (mobile app, web app, responsive web app, desktop app, etc.) with justification based on the target users and use cases, prioritizing best in terms of effort and impact",
  "productObjectives": "Specific, measurable, achievable, relevant, and time-bound objectives for the short term",
  "keyFeatures": "Recommended features and functionality based on the ideas provided",
  "marketAnalysis": "Size, competitors, trends, opportunities",
  "technicalRisks": "Identification and possible mitigations of technical risks",
  "businessRisks": "Identification and possible mitigations of business risks",
  "implementationStrategy": "What the product should be focused on in the short term, and medium term. Which part of the busines will demand more resources",
  "successMetrics": "Clear KPIs to measure product success when launching"
}

IMPORTANT: All values in the JSON must be strings, not nested objects or arrays. If you need to provide structured information, format it as a string with line breaks and bullet points.

IMPORTANT: In the proposedSolution field, you MUST include a clear recommendation on the optimal platform type (mobile app, web app, responsive web app, desktop app, etc.) with justification based on the target users and use cases.

Ensure the brief is actionable, specific, and provides clear guidance for the development and design team.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional product strategist who creates clear, concise, and actionable product briefs. You have extensive experience in digital product management and know industry best practices. Your goal is to provide documentation that effectively guides development and design teams. You're skilled at taking exploratory ideas and turning them into concrete, prioritized feature recommendations. You excel at identifying potential technical and business risks even with limited information. You always respond with valid JSON where all values are strings, not nested objects or arrays. You always include platform recommendations (mobile app, web app, etc.) in your proposed solutions."
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

    let responseContent = completion.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(responseContent);
      
      // Ensure all fields are strings
      const sanitizedResponse = ensureStringFields(parsedResponse);
      
      // Convert back to JSON string
      return JSON.stringify(sanitizedResponse, null, 2);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return responseContent; // Return the original response if parsing fails
    }
  } catch (error) {
    console.error('Error generating Brief:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to generate Brief. Please check your OpenAI API key and try again.');
    }
  }
}