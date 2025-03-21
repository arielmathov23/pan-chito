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

// For PRD Content
const formatPRDContent = (prd) => {
  let formattedPRD = "# Product Requirements\n\n";
  
  // Add project overview
  if (prd.projectOverview) {
    formattedPRD += "## Project Overview\n";
    formattedPRD += `${prd.projectOverview}\n\n`;
  }
  
  // Add features with priorities
  if (prd.sections && Array.isArray(prd.sections)) {
    formattedPRD += "## Features\n\n";
    
    prd.sections.forEach(section => {
      if (section.featureName) {
        formattedPRD += `### ${section.featureName}`;
        
        if (section.featurePriority) {
          formattedPRD += ` (${section.featurePriority})\n\n`;
        } else {
          formattedPRD += "\n\n";
        }
        
        // Add feature purpose/overview
        if (section.overview && section.overview.purpose) {
          formattedPRD += `**Purpose:** ${section.overview.purpose}\n\n`;
        }
        
        // Add user stories
        if (section.userStories && Array.isArray(section.userStories) && section.userStories.length > 0) {
          formattedPRD += "**User Stories:**\n";
          section.userStories.forEach((story, index) => {
            formattedPRD += `- ${story}\n`;
          });
          formattedPRD += "\n";
        }
        
        // Add acceptance criteria
        if (section.acceptanceCriteria && 
            section.acceptanceCriteria.criteria && 
            Array.isArray(section.acceptanceCriteria.criteria) && 
            section.acceptanceCriteria.criteria.length > 0) {
          formattedPRD += "**Acceptance Criteria:**\n";
          section.acceptanceCriteria.criteria.forEach((criterion, index) => {
            formattedPRD += `- ${criterion}\n`;
          });
          formattedPRD += "\n";
        }
      }
    });
  }
  
  return formattedPRD;
};

// For Technical Documentation
const formatTechDoc = (techDoc) => {
  let formattedTechDoc = "# Technical Documentation\n\n";
  
  // Add architecture overview
  if (techDoc.architecture) {
    formattedTechDoc += "## Architecture\n";
    formattedTechDoc += `${techDoc.architecture}\n\n`;
  }
  
  // Add tech stack
  if (techDoc.techStack) {
    formattedTechDoc += "## Technology Stack\n\n";
    
    if (typeof techDoc.techStack === 'string') {
      formattedTechDoc += techDoc.techStack + "\n\n";
    } else if (Array.isArray(techDoc.techStack)) {
      techDoc.techStack.forEach(tech => {
        formattedTechDoc += `- ${tech}\n`;
      });
      formattedTechDoc += "\n";
    } else if (typeof techDoc.techStack === 'object') {
      Object.entries(techDoc.techStack).forEach(([category, technologies]) => {
        formattedTechDoc += `### ${category}\n`;
        if (Array.isArray(technologies)) {
          technologies.forEach(tech => {
            formattedTechDoc += `- ${tech}\n`;
          });
        } else {
          formattedTechDoc += `${technologies}\n`;
        }
        formattedTechDoc += "\n";
      });
    }
  }
  
  // Add API endpoints if available
  if (techDoc.apis && Array.isArray(techDoc.apis)) {
    formattedTechDoc += "## API Endpoints\n\n";
    
    techDoc.apis.forEach(api => {
      formattedTechDoc += `### ${api.name || 'Endpoint'}\n`;
      formattedTechDoc += `- Method: ${api.method || 'N/A'}\n`;
      formattedTechDoc += `- Path: ${api.path || 'N/A'}\n`;
      if (api.description) formattedTechDoc += `- Description: ${api.description}\n`;
      formattedTechDoc += "\n";
    });
  }
  
  // Add database schema if available
  if (techDoc.database && techDoc.database.schema) {
    formattedTechDoc += "## Database Schema\n\n";
    
    if (Array.isArray(techDoc.database.schema)) {
      techDoc.database.schema.forEach(table => {
        formattedTechDoc += `### ${table.name || 'Table'}\n`;
        
        if (table.fields && Array.isArray(table.fields)) {
          formattedTechDoc += "| Field | Type | Description |\n";
          formattedTechDoc += "|-------|------|-------------|\n";
          
          table.fields.forEach(field => {
            formattedTechDoc += `| ${field.name || 'N/A'} | ${field.type || 'N/A'} | ${field.description || ''} |\n`;
          });
        }
        
        formattedTechDoc += "\n";
      });
    } else {
      formattedTechDoc += techDoc.database.schema + "\n\n";
    }
  }
  
  return formattedTechDoc;
};

// For App Screens
const formatScreens = (screens) => {
  if (!screens || !Array.isArray(screens)) return "";
  
  let formattedScreens = "# Application Screens\n\n";
  
  screens.forEach((screen, index) => {
    formattedScreens += `## Screen ${index + 1}: ${screen.name || 'Unnamed Screen'}\n\n`;
    
    if (screen.description) {
      formattedScreens += `**Description:** ${screen.description}\n\n`;
    }
    
    if (screen.components && Array.isArray(screen.components)) {
      formattedScreens += "**Components:**\n";
      screen.components.forEach(component => {
        formattedScreens += `- ${component.name || 'Component'}: ${component.description || ''}\n`;
      });
      formattedScreens += "\n";
    }
    
    if (screen.interactions && Array.isArray(screen.interactions)) {
      formattedScreens += "**Interactions:**\n";
      screen.interactions.forEach(interaction => {
        formattedScreens += `- ${interaction}\n`;
      });
      formattedScreens += "\n";
    }
  });
  
  return formattedScreens;
};

// For App Flow
const formatAppFlow = (appFlow) => {
  if (!appFlow) return "";
  
  let formattedFlow = "# Application Flow\n\n";
  
  if (Array.isArray(appFlow)) {
    appFlow.forEach((flow, index) => {
      formattedFlow += `## Flow ${index + 1}: ${flow.name || 'Unnamed Flow'}\n\n`;
      
      if (flow.description) {
        formattedFlow += `${flow.description}\n\n`;
      }
      
      if (flow.steps && Array.isArray(flow.steps)) {
        formattedFlow += "**Steps:**\n";
        flow.steps.forEach((step, stepIndex) => {
          formattedFlow += `${stepIndex + 1}. ${step}\n`;
        });
        formattedFlow += "\n";
      }
    });
  } else if (typeof appFlow === 'string') {
    formattedFlow += appFlow + "\n\n";
  } else if (typeof appFlow === 'object') {
    Object.entries(appFlow).forEach(([flowName, flowDetails]) => {
      formattedFlow += `## ${flowName}\n\n`;
      
      if (typeof flowDetails === 'string') {
        formattedFlow += `${flowDetails}\n\n`;
      } else if (Array.isArray(flowDetails)) {
        flowDetails.forEach((step, index) => {
          formattedFlow += `${index + 1}. ${step}\n`;
        });
        formattedFlow += "\n";
      }
    });
  }
  
  return formattedFlow;
};

export async function generateImplementationGuides(
  project: Project,
  brief: Brief,
  prd: PRD,
  techDoc: TechDoc,
  screenSet?: ScreenSet | null
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

  // Prepare screen data for the prompt
  let screenData = 'No screen data available';
  if (screenSet && screenSet.screens && screenSet.screens.length > 0) {
    // Format screen data with feature relationships
    const screensWithFeatures = screenSet.screens.map(screen => {
      return {
        id: screen.id,
        name: screen.name,
        description: screen.description,
        featureId: screen.featureId || 'unspecified', // Handle cases where featureId might not exist
        elements: screen.elements.map(el => ({
          type: el.type,
          properties: el.properties
        }))
      };
    });

    // Include app flow data
    const appFlowData = screenSet.appFlow ? {
      steps: screenSet.appFlow.steps.map(step => ({
        description: step.description,
        screenId: step.screenId
      }))
    } : { steps: [] };

    screenData = JSON.stringify({
      screens: screensWithFeatures,
      appFlow: appFlowData
    }, null, 2);
  }

  const prompt = `You are an expert engineering manager with 180 IQ tasked with creating implementation guides for the development of a project with an AI coder software. Your goal is to create two distinct files that will help an AI generate code for this project Implementation guides and Implemenation steps. To do so you have the context:


Product Name: ${brief?.product_name || ''}
PRD Content:
${formatPRDContent(prd.content)}

Technical Documentation:
${formatTechDoc(techDoc)}

App Screens and Flow:
${screenData}

With all that info, you task is to create two files, and its critical that you are smart and sharp to follow the instructions below:

1. Implementation Guide (.md file):
   - Provide a comprehensive overview of how to implement the project, including setup, installation required, and execution details.
   - Include architectural decisions (e.g., directory structure, routing approach, styling strategy).
   - Incorporate technical stack details and UI guidelines. This solution must be modern, techie, and cool.
   - Detail how to manage contrast colors, accessibility, and responsive design.
   - Specify that all code must reside in a src/ directory and in case it is a web app, use Next.js App Router(src/app/ directory).
   - Avoid nested directory issues by keeping route definitions flat and logical.
   - In case using tailwind CSS Setup: Explicitly require a correct Tailwind set up and configuration: create a tailwind.config.js file with content paths and theme extensions.
   - Update package.json with correct dependencies: tailwindcss, postcss.
   - In src/app/globals.css, use Tailwind directives and define base styles.
   - If necessary, Next.js Configuration**: Require next.config.js

2. Implementation Steps (.md file):
   - Explain the structure of the solution, what are the main features, what is the main flow.
   - Structured step-by-step breakdown to develop all the screens and features. Breaking down complex features into executable steps.
   - Each step must be completed with all the details coming from PRD and App Screens, including in each step all the UX information. Do not summarize anything.
   - Do not include any code or set up indications, this will be done with the guide above automatically by the AI coder assistant.
   - Backend is not mocked, it will be running in the same port as the frontend. 
   - Ensure all the information submitted by the user will be saved and used.
   - Organize the steps in Phases: 1) development of all the features running in local, you can split this in phases if needed. if there is an external service use a mock integration (like openai) ; 2) add integrations (if they are included on the input, if not do not mentiont this, i.e. openai) and add login/sign up if needed; 3) integrate database for saving info and auth.
   - Login/sign up must be implemented in Phase 2, but info must be saved at least in local storage from stage 1.
   - Do not add any Conclusion, just the development steps.

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

export async function generateImplementation(prd: PRD, techDoc: TechDoc, screenSet: ScreenSet | null): Promise<Implementation> {
  console.log("=== Implementation Generation Started ===");
  console.log(`PRD ID: ${prd.id}`);
  
  // Prepare the input data - include complete PRD, tech doc and screens info
  const inputData = {
    prdContent: prd.content,
    techDoc: {
      techStack: techDoc.techStack,
      frontend: techDoc.frontend,
      backend: techDoc.backend,
      content: techDoc.content
    },
    screens: screenSet ? {
      screens: screenSet.screens,
      appFlow: screenSet.appFlow
    } : null
  };
  
  console.log(`Input data prepared, PRD content length: ${JSON.stringify(prd.content).length}`);
  console.log(`Tech doc included: ${techDoc.techStack || 'No tech stack specified'}`);
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
${formatPRDContent(inputData.prdContent)}

Technical Documentation:
${formatTechDoc(inputData.techDoc)}

${inputData.screens ? formatScreens(inputData.screens.screens) : ''}

${inputData.screens ? formatAppFlow(inputData.screens.appFlow) : ''}

You task is to create two files that include all the information needed to implement the project, without erasing any information from the PRD, Screens definitions and App Flow:

1. Implementation Guide (.md file):
   - A comprehensive overview of how to implement the project, avoiding duplicated pages or routes.
   - Must incorporate technical stack details and UI guidelines, shadcn/ui is preferred.
   - Must include high-level architectural decisions, but do not define any code.
   - Include all the prompts and descriptions for set up and to install the necessary dependencies. 
   - Define code placement: All code in src/ (e.g., src/app/ for App Router, src/components/ for UI, src/lib/ for utilities like Supabase client).
   - Avoid Nested Directory Issues
   - Prompt to do not customize the import alias ('@/*' by default).
   - Detail how to manage contrast, accessibility, and responsive desing.


2. Implementation Steps (.md file):
   - Explain the structure: what are the main features, what is the main flow.
   - Structured step-by-step breakdown to develop all the screens and features. Breaking down complex features into executable steps.
   - Each step must be completed with all the details coming from PRD and App Screens, including in each step all the UX information. Do not summarize anything.
   - Do not include any code or architecture indications, this will be done with the guide above automatically by the AI coder assistant.
   - Backend is not mocked, it will be running in the same port as the frontend. 
   - Organize the steps in Phases: 1) development of all the features running in local, you can split this in phases if needed. if there is an external service use a mock integration (like openai) ; 2) add integrations (if they are included on the input, if not do not mentiont this, i.e. openai) and add login/sign up if needed; 3) integrate database for saving info and auth.
   - Login/sign up must be implemented in Phase 2, but info must be saved at least in local storage from stage 1.
   - Do not add any Conclusion, just the development steps.

Please provide your response as two separate text blocks, clearly labeled as "IMPLEMENTATION_GUIDE" and "IMPLEMENTATION_STEPS". Each should be formatted in markdown and be comprehensive enough to guide an AI agent through the entire implementation process.`;

      console.log("Sending request to OpenAI API...");
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert software architect with deep knowledge of modern web development.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 8000
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