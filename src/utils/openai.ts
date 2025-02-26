import OpenAI from 'openai';
import { PRDFormData } from '../components/PRDForm';

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

// Mock implementation for testing purposes
function generateMockPRD(formData: PRDFormData): string {
  return `# Product Requirements Document: ${formData.title}

## Executive Summary
This document outlines the requirements for ${formData.title}, a product designed to ${formData.description}.

## Product Overview
${formData.description}

## Target Market Analysis
${formData.targetAudience}

## Problem Definition
${formData.problemStatement}

## Solution Overview
${formData.proposedSolution}

## Key Features and Functionality
${formData.keyFeatures}

## Success Metrics and KPIs
${formData.successMetrics}

## Implementation Considerations
- Timeline: 3-6 months
- Resources needed: Development team, design team, QA team
- Technical requirements: To be determined

## Risks and Mitigation Strategies
- Risk: Market competition
- Mitigation: Focus on unique value proposition

## Timeline and Milestones
- Month 1: Design and planning
- Month 2-4: Development
- Month 5: Testing
- Month 6: Launch

*Note: This is a mock PRD generated for testing purposes.*`;
}

export async function generatePRD(formData: PRDFormData): Promise<string> {
  // Use mock implementation if API key is missing
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return generateMockPRD(formData);
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.');
  }

  const prompt = `Create a detailed Product Requirements Document (PRD) based on the following information:

Title: ${formData.title}

Description:
${formData.description}

Target Audience:
${formData.targetAudience}

Problem Statement:
${formData.problemStatement}

Proposed Solution:
${formData.proposedSolution}

Key Features:
${formData.keyFeatures}

Success Metrics:
${formData.successMetrics}

Please format the PRD in a clear, professional structure with markdown formatting. Include the following sections:
1. Executive Summary
2. Product Overview
3. Target Market Analysis
4. Problem Definition
5. Solution Overview
6. Key Features and Functionality
7. Success Metrics and KPIs
8. Implementation Considerations
9. Risks and Mitigation Strategies
10. Timeline and Milestones`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional product manager who creates clear, detailed, and actionable PRDs."
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
    console.error('Error generating PRD:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to generate PRD. Please check your OpenAI API key and try again.');
    }
  }
} 