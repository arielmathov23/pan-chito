import OpenAI from 'openai';
import { Project } from './projectStore';
import { PRD } from './prdStore';
import { TechDoc } from '../services/techDocService';
import { Brief } from '../services/briefService';
import { ScreenSet } from './screenStore';

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
// Only use mock if there's definitely no API key and we're in the browser
const USE_MOCK = !apiKey && typeof window !== 'undefined';

// Debug log for API key detection
if (typeof window !== 'undefined') {
  console.log('API Key available for implementation generator:', !!apiKey);
  console.log('Using mock for implementation generator:', USE_MOCK);
}

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for implementation generator.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error, will fail on actual API call
  dangerouslyAllowBrowser: true
});

export interface ImplementationGuides {
  implementationGuide: string;
  implementationSteps: string;
}

export interface Implementation {
  techStack: string;
  architecture: string;
  components: string;
  apiEndpoints: string;
  databaseSchema: string;
}

// Mock implementation for testing purposes
function generateMockImplementationGuides(): ImplementationGuides {
  return {
    implementationGuide: `# Implementation Guide for Task Manager App

## Project Overview
This is a modern task management application designed to help users organize their daily tasks. The app will feature a clean, minimalist interface with intuitive task creation, editing, and organization capabilities.

## Tech Stack
- **Frontend**: React.js with Next.js
- **Styling**: Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Frontend Guidelines
- Use Tailwind CSS for styling with a consistent color scheme
- Implement responsive design for all screen sizes
- Ensure accessibility compliance (WCAG 2.1 AA)
- Build reusable components for common UI elements

## Backend Guidelines
- RESTful API design for all endpoints
- Implement proper error handling and validation
- Use middleware for authentication and authorization
- Structure routes logically by resource

## UI/UX Guidelines
- Clean, minimalist design with ample white space
- Intuitive navigation and user flows
- Visual feedback for user actions
- Smooth transitions and animations

## Note: This is a mock implementation guide for testing purposes. To generate a real guide, please ensure your OpenAI API key is properly configured.`,

    implementationSteps: `# Implementation Steps for Task Manager App

## Stage 1: Project Setup
1. Set up Next.js project with TypeScript
2. Configure Tailwind CSS
3. Set up ESLint and Prettier
4. Create basic project structure
5. Initialize Supabase client

## Stage 2: Authentication
1. Create sign-up page
2. Implement login functionality
3. Add password reset flow
4. Create protected routes
5. Set up user profile page

## Stage 3: Core Features
1. Implement task creation
2. Build task list view
3. Add task editing functionality
4. Implement task deletion
5. Create task filtering and sorting

## Stage 4: UI Refinement
1. Implement responsive design
2. Add animations and transitions
3. Create dark/light mode toggle
4. Improve accessibility features
5. Optimize for mobile devices

## Stage 5: Testing & Deployment
1. Write unit tests for components
2. Implement integration tests
3. Perform end-to-end testing
4. Deploy to Vercel
5. Set up CI/CD pipeline

## Note: This is a mock implementation steps guide for testing purposes. To generate real implementation steps, please ensure your OpenAI API key is properly configured.`
  };
}

export async function generateImplementationGuides(
  project: Project,
  brief: Brief,
  prd: PRD,
  techDoc: TechDoc
): Promise<ImplementationGuides> {
  // Use mock implementation if API key is missing
  if (USE_MOCK) {
    console.log('Using mock implementation for implementation guides');
    return generateMockImplementationGuides();
  }

  if (!project || !project.name) {
    console.error('Invalid project data:', project);
    throw new Error('Invalid project data. Project name is required.');
  }

  if (!prd || !prd.content) {
    console.error('Invalid PRD data:', prd);
    throw new Error('Invalid PRD data. PRD content is required.');
  }

  if (!techDoc) {
    console.error('Invalid technical documentation:', techDoc);
    throw new Error('Invalid technical documentation. Tech doc is required.');
  }

  const prompt = `You are an expert engineering manager with 180 IQ tasked with creating implementation guides for the development of a project with an AI coder software. Your goal is to create two distinct files that will help an AI generate code for this project:

Project Information:
Product Name: ${brief?.product_name || ''}

PRD Content:
${JSON.stringify(prd.content, null, 2)}

Technical Documentation:
Tech Stack: ${techDoc.techStack || 'Not specified'}
Frontend: ${techDoc.frontend || 'Not specified'}
Backend: ${techDoc.backend || 'Not specified'}
Content: ${JSON.stringify(techDoc.content || {}, null, 2)}

You task is to create two files:

1. Implementation Guide (.md file):
   - A comprehensive overview of how to implement the project
   - Must include high-level architectural decisions
   - Must incorporate technical stack details and UI guidelines
   - Detail how to manage contrast, accessibility, and responsive desing.
   - Definition to place the code in a src/ directory, use App Router
   - Avoid Nested Directory Issues
   - Use Turbopack for 'next dev', do not customize the import alias ('@/*' by default).

2. Implementation Steps (.md file):
   - Structured step-by-step breakdown to develop all the pages and features. Breaking down feature content into executable steps (one step per feature).
   - Ensure consistent alignment with project guides, do not create any new features or pages that are not defined in the PRD, Screens definitions and App Flow.
   - Ensure all the details coming from the PRD, Screens definitions and App Flow are inlcuded.
   - Do not add any code here just prompt and descriptions.
   - Backend is not mocked, it will be running in the same port as the frontend.
   - Organize the steps in Phases: 1) development of all the features running in local, you can split this in phases if needed. if there is an external service use a mock integration (like openai) ; 2) add integrations if needed (i.e. openai) and login/sign up if needed; 3) integrate database for saving info and auth

Please provide your response as two separate text blocks, clearly labeled as "IMPLEMENTATION_GUIDE" and "IMPLEMENTATION_STEPS". Each should be formatted in markdown and be comprehensive enough to guide an AI agent through the entire implementation process.`;

  try {
    console.log('Sending request to OpenAI API for implementation guides');
    
    // Set headers to ensure proper content-type negotiation
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert AI engineering assistant that creates detailed implementation guides for AI coding agents. You provide separate files that allow AI systems to understand how to properly implement software projects based on requirements. Your implementation guides should be comprehensive, providing clear direction and best practices. Your implementation steps should be structured, detailed, and broken into logical phases to create a clear roadmap for development."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000
    }, requestOptions);

    if (!completion.choices || completion.choices.length === 0 || !completion.choices[0]?.message?.content) {
      console.error('Empty or invalid response from OpenAI API:', completion);
      throw new Error('Failed to generate implementation guides. Received empty response from OpenAI API.');
    }

    const responseContent = completion.choices[0]?.message?.content || '';
    console.log('Received response from OpenAI API, processing content');
    
    // Extract the two parts from the response
    const guidePart = responseContent.includes('IMPLEMENTATION_GUIDE') 
      ? responseContent.split('IMPLEMENTATION_GUIDE')[1].split('IMPLEMENTATION_STEPS')[0].trim() 
      : '';
      
    const stepsPart = responseContent.includes('IMPLEMENTATION_STEPS') 
      ? responseContent.split('IMPLEMENTATION_STEPS')[1].trim() 
      : '';
    
    // If we couldn't extract both parts properly, use a different approach
    if (!guidePart || !stepsPart) {
      console.warn('Could not extract guide and steps parts using markers, trying fallback approach');
      // Try to split the content in half as a fallback
      const contentParts = responseContent.split('\n\n');
      const midPoint = Math.floor(contentParts.length / 2);
      
      const fallbackGuide = contentParts.slice(0, midPoint).join('\n\n');
      const fallbackSteps = contentParts.slice(midPoint).join('\n\n');
      
      if (!fallbackGuide || !fallbackSteps) {
        console.error('Failed to extract implementation guides from response:', responseContent);
        throw new Error('Failed to parse implementation guides from OpenAI response.');
      }
      
      console.log('Successfully extracted implementation guides using fallback approach');
      return {
        implementationGuide: fallbackGuide,
        implementationSteps: fallbackSteps
      };
    }
    
    console.log('Successfully extracted implementation guides using markers');
    return {
      implementationGuide: guidePart,
      implementationSteps: stepsPart
    };
  } catch (error) {
    console.error('Error generating implementation guides:', error);
    
    // Provide more detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please add a valid OPENAI_API_KEY to your .env.local file.');
      } else if (error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later or use a different API key.');
      } else if (error.message.includes('401')) {
        throw new Error('OpenAI API authentication failed. Please check your API key.');
      } else if (error.message.includes('500')) {
        throw new Error('OpenAI API server error. Please try again later.');
      } else if (error.message.includes('timeout')) {
        throw new Error('OpenAI API request timed out. Please try again later.');
      } else {
        throw new Error(`Failed to generate implementation guides: ${error.message}`);
      }
    } else {
      throw new Error('Failed to generate implementation guides. Please check your OpenAI API key and try again.');
    }
  }
}

export async function generateImplementation(prd: PRD, screenSet: ScreenSet | null): Promise<Implementation> {
  console.log("=== Implementation Generation Started ===");
  console.log(`PRD ID: ${prd.id}`);
  
  // Prepare the input data - include complete PRD and screens info, remove brief
  const inputData = {
    prdContent: prd.content,
    screens: screenSet ? {
      screens: screenSet.screens,
      appFlow: screenSet.appFlow
    } : null
  };
  
  console.log(`Input data prepared, PRD content length: ${JSON.stringify(prd.content).length}`);
  if (screenSet) {
    console.log(`Including ${screenSet.screens.length} screens and app flow with ${screenSet.appFlow.steps.length} steps`);
  } else {
    console.log("No screens data available");
  }
  
  // Implement the OpenAI API call to generate implementation
  if (!USE_MOCK && apiKey) {
    try {
      const prompt = `You are an expert engineering manager with 180 IQ tasked with creating implementation guides for the development of a project with an AI coder software. Your goal is to create two distinct files that will help an AI generate code for this project:

PRD Content:
${JSON.stringify(inputData.prdContent, null, 2)}

${inputData.screens ? `
App Screens:
${JSON.stringify(inputData.screens.screens, null, 2)}

App Flow:
${JSON.stringify(inputData.screens.appFlow, null, 2)}
` : 'No screen data available.'}

You task is to create two files:

1. Implementation Guide (.md file):
   - A comprehensive overview of how to implement the project
   - Must include high-level architectural decisions
   - Must incorporate technical stack details and UI guidelines
   - Detail how to manage contrast, accessibility, and responsive desing.
   - Definition to place the code in a src/ directory, use App Router
   - Avoid Nested Directory Issues
   - Use Turbopack for 'next dev', do not customize the import alias ('@/*' by default).

2. Implementation Steps (.md file):
   - Structured step-by-step breakdown to develop all the pages and features. Breaking down feature content into executable steps (one step per feature).
   - Ensure consistent alignment with project guides.
   - Ensure all the details coming from the PRD, Screens definitions and App Flow are respected.
   - Do not add any code here just prompt and descriptions.
   - Backend is not mocked, it will be running in the same port as the frontend.
   - Organize the steps in Phases: 1) development of all the features running in local, you can split this in phases if needed. if there is an external service use a mock integration (like openai) ; 2) add integrations if needed (i.e. openai) and login/sign up if needed; 3) integrate database for saving info and auth

Please provide your response as two separate text blocks, clearly labeled as "IMPLEMENTATION_GUIDE" and "IMPLEMENTATION_STEPS". Each should be formatted in markdown and be comprehensive enough to guide an AI agent through the entire implementation process.`;

      console.log("Sending request to OpenAI API...");
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are an expert software architect with deep knowledge of modern web development.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to generate implementation. Empty response from OpenAI.');
      }

      console.log("Parsing OpenAI response...");
      
      // Extract sections from the response
      const implementationGuideMatch = content.match(/IMPLEMENTATION_GUIDE[\s\S]*?(?=IMPLEMENTATION_STEPS|$)/i);
      const implementationStepsMatch = content.match(/IMPLEMENTATION_STEPS[\s\S]*?(?=$)/i);

      // For the Implementation interface, extract sections from the implementation guide
      const techStackMatch = content.match(/Tech Stack:[\s\S]*?(?=Architecture:|$)/i);
      const architectureMatch = content.match(/Architecture:[\s\S]*?(?=Components:|$)/i);
      const componentsMatch = content.match(/Components:[\s\S]*?(?=API Endpoints:|$)/i);
      const apiEndpointsMatch = content.match(/API Endpoints:[\s\S]*?(?=Database Schema:|$)/i);
      const databaseSchemaMatch = content.match(/Database Schema:[\s\S]*?(?=IMPLEMENTATION_STEPS|$)/i);

      return {
        techStack: techStackMatch ? techStackMatch[0].replace(/Tech Stack:/i, '').trim() : "Not specified",
        architecture: architectureMatch ? architectureMatch[0].replace(/Architecture:/i, '').trim() : "Not specified",
        components: componentsMatch ? componentsMatch[0].replace(/Components:/i, '').trim() : "Not specified",
        apiEndpoints: apiEndpointsMatch ? apiEndpointsMatch[0].replace(/API Endpoints:/i, '').trim() : "Not specified",
        databaseSchema: databaseSchemaMatch ? databaseSchemaMatch[0].replace(/Database Schema:/i, '').trim() : "Not specified"
      };
    } catch (error: any) {
      console.error("Error generating implementation:", error);
      throw new Error(`Failed to generate implementation: ${error.message}`);
    }
  }
  
  // Return mock implementation if API call is not available
  return {
    techStack: "React, Next.js, TypeScript, Tailwind CSS",
    architecture: "Client-server architecture with RESTful API",
    components: "Authentication, Dashboard, User Management, etc.",
    apiEndpoints: "/api/auth, /api/users, /api/projects",
    databaseSchema: "Users, Projects, Tasks, etc."
  };
} 