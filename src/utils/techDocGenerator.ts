import OpenAI from 'openai';
import { Brief } from './briefStore';
import { PRD } from './prdStore';
import { TechDoc } from './techDocStore';

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const USE_MOCK = !apiKey && typeof window !== 'undefined';

// Debug log for API key detection
if (typeof window !== 'undefined') {
  console.log('API Key available for tech doc generator:', !!apiKey);
  console.log('Using mock for tech doc generator:', USE_MOCK);
}

if (USE_MOCK && typeof window !== 'undefined') {
  console.warn('OpenAI API key is missing. Using mock implementation for tech doc generator.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization error, will fail on actual API call
  dangerouslyAllowBrowser: true
});

export interface TechDocumentation {
  techStack: {
    overview: string;
    frontend: string;
    backend: string;
    database: string;
    deployment: string;
    thirdPartyServices: string;
  };
  frontendGuidelines: {
    overview: string;
    colorPalette: string;
    typography: string;
    componentStructure: string;
    responsiveDesign: string;
    accessibilityConsiderations: string;
    uiReferences: string;
  };
  backendStructure: {
    overview: string;
    apiRoutes: string;
    databaseSchema: string;
    authentication: string;
    integrations: string;
    dataProcessing: string;
  };
}

// Ensure all fields in the documentation are strings
function ensureStringFields(doc: any): TechDocumentation {
  const result: any = {
    techStack: {},
    frontendGuidelines: {},
    backendStructure: {}
  };
  
  for (const section of Object.keys(doc)) {
    for (const key of Object.keys(doc[section])) {
      const value = doc[section][key];
      if (typeof value === 'string') {
        result[section][key] = value;
      } else {
        // Convert non-string values to formatted strings
        result[section][key] = JSON.stringify(value, null, 2);
      }
    }
  }
  
  return result as TechDocumentation;
}

// Mock implementation for testing purposes
function generateMockTechDoc(brief: Brief, prd: PRD): Omit<TechDoc, 'id' | 'prdId' | 'createdAt' | 'updatedAt'> {
  return {
    techStack: generateTechStackContent(brief, prd),
    frontend: generateFrontendContent(brief, prd),
    backend: generateBackendContent(brief, prd),
    content: {
      platform: { targets: [], requirements: [] },
      frontend: {},
      backend: {},
      api: {},
      database: {},
      deployment: {}
    }
  };
}

export async function generateTechDocumentation(brief: Brief, prd: PRD): Promise<Omit<TechDoc, 'id' | 'prdId' | 'createdAt' | 'updatedAt'>> {
  // Use mock implementation if API key is missing
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return generateMockTechDoc(brief, prd);
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.');
  }

  const prompt = `You are a senior technical architect and a UXUI strategist with expertise in modern tech development. Your task is to create comprehensive technical documentation for a new product based on the provided brief and PRD. The documentation should include three main sections: Tech Stack, Frontend Guidelines, and Backend Structure.

Product Brief:
${JSON.stringify(brief.briefData, null, 2)}

Product Name: ${brief.productName}

PRD:
${JSON.stringify(prd.content, null, 2)}

Please provide your response as a JSON object with the following structure:

{
  "techStack": {
    "overview": "A brief overview of the recommended technology stack including the platform.",
    "frontend": "Frontend technologies with justification",
    "backend": "Backend technologies with justification",
    "database": "Database recommendations with justification",
    "deployment": "Deployment and hosting recommendations",
    "thirdPartyServices": "Any third-party services or APIs needed"
  },
  "frontendGuidelines": {
    "overview": "Brief overview of the frontend guidelines",
    "colorPalette": "Recommended color palette with hex codes based on the product's brand and purpose",
    "typography": "Typography recommendations including font families and sizes",
    "componentStructure": "How components should be organized and structured",
    "responsiveDesign": "Guidelines for ensuring the application works across devices",
    "accessibilityConsiderations": "Key accessibility requirements to implement",
    "uiReferences": "References to similar UIs or design systems for inspiration"
  },
  "backendStructure": {
    "overview": "Brief overview of the backend architecture",
    "apiRoutes": "Recommended API route structure",
    "databaseSchema": "High-level database schema design",
    "authentication": "Authentication and authorization approach",
    "integrations": "Details on external integrations or APIs",
    "dataProcessing": "How data should be processed and transformed"
  }
}

Technical Requirements and Preferences:

1. Tech Stack:
   - Frontend: Prefer Next.js or React, with Tailwind CSS for styling
   - Backend: Node.js with Express.js is preferred
   - Database: Supabase (PostgreSQL)
   - Deployment: Vercel for hosting

2. Frontend Guidelines:
   - Include a specific color palette with hex codes
   - Provide clear UI references and inspiration sources
   - Consider accessibility standards

3. Backend Structure:
   - Keep it reasonably simple but scalable
   - Explain any necessary integrations or data scraping approaches
   - Focus on practical implementation details

Ensure all recommendations are justified based on the product requirements and target users. The documentation should be detailed enough to guide development but not overly complex.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a senior technical architect with expertise in modern web development stacks. You provide clear, practical technical documentation that balances best practices with pragmatic implementation details. You have deep knowledge of React, Next.js, Node.js, Express, Supabase, and Vercel. You excel at creating technical specifications that are detailed enough to guide development without being overly complex. You always respond with valid JSON where all values are strings, not nested objects or arrays."
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
      const jsonString = JSON.stringify(sanitizedResponse, null, 2);
      
      // Parse the TechDocumentation into the TechDoc format
      return {
        techStack: jsonString,
        frontend: jsonString,
        backend: jsonString,
        content: {
          platform: { targets: [], requirements: [] },
          frontend: {},
          backend: {},
          api: {},
          database: {},
          deployment: {}
        }
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Return a valid object structure even in case of error
      return {
        techStack: responseContent,
        frontend: responseContent,
        backend: responseContent,
        content: {
          platform: { targets: [], requirements: [] },
          frontend: {},
          backend: {},
          api: {},
          database: {},
          deployment: {}
        }
      };
    }
  } catch (error) {
    console.error('Error generating Tech Documentation:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to generate Tech Documentation. Please check your OpenAI API key and try again.');
    }
  }
}

// Function to parse tech documentation from a raw text response
export function parseTechDoc(techDoc: Omit<TechDoc, 'id' | 'prdId' | 'createdAt' | 'updatedAt'>): Omit<TechDoc, 'id' | 'prdId' | 'createdAt' | 'updatedAt'> {
  // In a real application, this might do some processing on the generated content
  return techDoc;
}

function generateTechStackContent(brief: Brief, prd: PRD): string {
  // Safely check for platforms, defaulting to web
  const platforms = (brief as any).platforms || ['web'];
  const isWeb = platforms.includes('web');
  const isIOS = platforms.includes('ios');
  const isAndroid = platforms.includes('android');
  
  let content = `# Technology Stack Recommendations

## Overview

Based on the requirements outlined in the PRD for ${brief.productName}, we recommend the following technology stack to ensure efficient development, scalability, and maintainability.

## Recommended Technologies

`;

  if (isWeb) {
    content += `### Frontend (Web)

- **Framework**: React.js with Next.js
  - Provides server-side rendering capabilities
  - Excellent developer experience and community support
  - Built-in routing and API capabilities

- **State Management**: Redux Toolkit
  - Centralized state management
  - Predictable state updates
  - Developer tools for debugging

- **Styling**: Tailwind CSS
  - Utility-first approach for rapid UI development
  - Highly customizable design system
  - Excellent responsive design capabilities

- **Component Library**: Headless UI
  - Unstyled, accessible components
  - Seamlessly integrates with Tailwind CSS
  - Provides core functionality while allowing custom styling

`;
  }

  if (isIOS || isAndroid) {
    content += `### Mobile Development

`;

    if (isIOS) {
      content += `- **iOS**: Swift with SwiftUI
  - Modern, declarative UI framework
  - Strong type safety and performance
  - Native Apple platform integration

`;
    }

    if (isAndroid) {
      content += `- **Android**: Kotlin with Jetpack Compose
  - Modern, declarative UI toolkit
  - Interoperability with Java
  - Comprehensive suite of libraries and tools

`;
    }

    if (isIOS && isAndroid) {
      content += `- **Cross-Platform Alternative**: React Native
  - Share code between iOS and Android
  - Leverage existing React knowledge
  - Native performance with JavaScript development

`;
    }
  }

  content += `### Backend

- **API Framework**: Node.js with Express
  - Lightweight and flexible
  - Large ecosystem of middleware
  - JavaScript/TypeScript across the stack

- **Database**: MongoDB
  - Flexible schema for rapid iteration
  - Scalable document-based structure
  - Strong support for JavaScript/TypeScript

- **Authentication**: Auth0
  - Secure, standards-based authentication
  - Social login integration
  - Multi-factor authentication support

## Infrastructure

- **Hosting**: Vercel (Frontend) / AWS (Backend)
  - Optimized for Next.js deployment
  - Global CDN for fast content delivery
  - Serverless functions for API endpoints

- **CI/CD**: GitHub Actions
  - Automated testing and deployment
  - Seamless integration with GitHub repositories
  - Customizable workflows

- **Monitoring**: Sentry
  - Real-time error tracking
  - Performance monitoring
  - User session replay

## Development Tools

- **Language**: TypeScript
  - Static typing for improved code quality
  - Enhanced IDE support and autocompletion
  - Better documentation and maintainability

- **Package Manager**: npm or Yarn
  - Dependency management
  - Script automation
  - Version control

- **Testing**: Jest with React Testing Library
  - Unit and integration testing
  - Component testing
  - Snapshot testing

## Rationale

This technology stack was selected based on the following criteria:

1. **Developer Experience**: Tools that enhance productivity and code quality
2. **Scalability**: Technologies that can grow with the product
3. **Community Support**: Well-established libraries with active communities
4. **Performance**: Optimized for fast user experiences
5. **Maintainability**: Code organization and testing capabilities`;

  return content;
}

function generateFrontendContent(brief: Brief, prd: PRD): string {
  return `# Frontend Guidelines

## Overview

These frontend guidelines ensure consistency across the user interface for ${brief.productName}. They provide a framework for design decisions and implementation details.

## Design System

### Typography

- **Primary Font**: Inter
  - Headings: Semi-bold (600)
  - Body: Regular (400)
  - Captions: Light (300)

- **Font Sizes**:
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)
  - Caption: 0.75rem (12px)

- **Line Heights**:
  - Headings: 1.2
  - Body: 1.5
  - Tight: 1.25

### Color Palette

- **Primary Colors**:
  - Primary: #0F533A (Dark Green)
  - Secondary: #8B5CF6 (Purple)
  - Accent: #3B82F6 (Blue)

- **Neutral Colors**:
  - Text (Dark): #111827
  - Text (Medium): #4B5563
  - Text (Light): #6B7280
  - Background (Light): #F8F9FA
  - Background (Medium): #F0F2F5
  - Background (Dark): #E5E7EB

- **Feedback Colors**:
  - Success: #10B981
  - Warning: #F59E0B
  - Error: #EF4444
  - Info: #3B82F6

### Spacing System

- **Base Unit**: 4px
- **Spacing Scale**:
  - xs: 4px (0.25rem)
  - sm: 8px (0.5rem)
  - md: 16px (1rem)
  - lg: 24px (1.5rem)
  - xl: 32px (2rem)
  - 2xl: 48px (3rem)
  - 3xl: 64px (4rem)

### Border Radius

- Small: 4px (0.25rem)
- Medium: 8px (0.5rem)
- Large: 12px (0.75rem)
- XL: 16px (1rem)
- Rounded: 9999px (for pills and circles)

## Component Guidelines

### Buttons

- **Primary Button**:
  - Background: Primary color
  - Text: White
  - Hover: Darken by 10%
  - Padding: 10px 16px
  - Border Radius: Medium

- **Secondary Button**:
  - Background: White
  - Border: 1px solid neutral color
  - Text: Medium text color
  - Hover: Light background color

- **Tertiary Button**:
  - Background: Transparent
  - Text: Primary color
  - Hover: Very light background

- **Disabled State**:
  - Opacity: 0.7
  - Cursor: not-allowed

### Forms

- **Input Fields**:
  - Height: 40px
  - Border: 1px solid neutral color
  - Border Radius: Medium
  - Padding: 8px 12px
  - Focus: Primary color border

- **Labels**:
  - Position: Above input
  - Font Weight: Medium
  - Margin Bottom: 4px

- **Error States**:
  - Border Color: Error color
  - Error Text: Below input, error color
  - Icon: Error icon before text

### Cards

- **Default Card**:
  - Background: White
  - Border: 1px solid light neutral
  - Border Radius: Large
  - Shadow: Subtle shadow
  - Padding: 24px

- **Interactive Cards**:
  - Hover: Slightly darker background
  - Cursor: pointer
  - Transition: 0.2s all ease

## Responsive Design

- **Breakpoints**:
  - Mobile: 0-639px
  - Tablet: 640px-1023px
  - Desktop: 1024px+

- **Mobile First Approach**:
  - Design for mobile first
  - Enhance for larger screens
  - Use relative units (rem, %) over fixed units

## Accessibility Guidelines

- **Color Contrast**:
  - Minimum ratio of 4.5:1 for normal text
  - Minimum ratio of 3:1 for large text

- **Focus States**:
  - Visible focus indicators
  - Skip to content link

- **Semantic HTML**:
  - Use appropriate HTML elements
  - Implement ARIA attributes when necessary

- **Keyboard Navigation**:
  - All interactive elements must be keyboard accessible
  - Logical tab order

## Animation Guidelines

- **Duration**:
  - Fast: 100ms
  - Medium: 200ms
  - Slow: 300ms

- **Easing**:
  - Default: ease-in-out
  - Enter: ease-out
  - Exit: ease-in

- **Usage**:
  - Use animations purposefully
  - Avoid animations that may cause vestibular disorders
  - Respect user preferences (prefers-reduced-motion)

## Icons

- **Style**:
  - Line icons with consistent stroke width
  - Rounded corners
  - 24x24px viewbox

- **Implementation**:
  - SVG format
  - Current color for easy theming
  - Consistent sizing system`;
}

function generateBackendContent(brief: Brief, prd: PRD): string {
  return `# Backend Structure

## Overview

This document outlines the backend architecture for ${brief.productName}, including API design, database schema, and core business logic.

## API Design

### RESTful API Structure

- **Base URL**: \`/api/v1\`
- **Authentication**: JWT-based authentication with refresh tokens
- **Response Format**:
  \`\`\`
  {
    "success": boolean,
    "data": object | array | null,
    "error": string | null,
    "meta": {
      "pagination": object | null
    }
  }
  \`\`\`

### API Endpoints

#### Authentication

- **POST** \`/auth/register\`
  - Create a new user account
  - Required fields: email, password, name

- **POST** \`/auth/login\`
  - Authenticate a user
  - Required fields: email, password
  - Returns: JWT token, refresh token

- **POST** \`/auth/refresh\`
  - Refresh an expired JWT token
  - Required fields: refresh_token
  - Returns: New JWT token

- **POST** \`/auth/logout\`
  - Invalidate refresh token
  - Required: Authentication

#### Users

- **GET** \`/users/me\`
  - Get current user profile
  - Required: Authentication

- **PATCH** \`/users/me\`
  - Update current user profile
  - Required: Authentication

#### Projects

- **GET** \`/projects\`
  - List all projects for current user
  - Required: Authentication
  - Query parameters: page, limit, sort, filter

- **POST** \`/projects\`
  - Create a new project
  - Required: Authentication
  - Required fields: name, description

- **GET** \`/projects/:id\`
  - Get project details
  - Required: Authentication, Project access

- **PATCH** \`/projects/:id\`
  - Update project details
  - Required: Authentication, Project access

- **DELETE** \`/projects/:id\`
  - Delete a project
  - Required: Authentication, Project ownership

#### Documents

- **GET** \`/projects/:projectId/documents\`
  - List all documents in a project
  - Required: Authentication, Project access

- **POST** \`/projects/:projectId/documents\`
  - Create a new document
  - Required: Authentication, Project access
  - Required fields: title, type, content

- **GET** \`/documents/:id\`
  - Get document details
  - Required: Authentication, Document access

- **PATCH** \`/documents/:id\`
  - Update document details
  - Required: Authentication, Document access

- **DELETE** \`/documents/:id\`
  - Delete a document
  - Required: Authentication, Document ownership

## Database Schema

### Users Collection

\`\`\`
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  avatar: String (URL),
  role: String (enum: 'user', 'admin'),
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
\`\`\`

### Projects Collection

\`\`\`
{
  _id: ObjectId,
  name: String (required),
  description: String,
  owner: ObjectId (ref: Users),
  collaborators: [
    {
      user: ObjectId (ref: Users),
      role: String (enum: 'viewer', 'editor', 'admin')
    }
  ],
  status: String (enum: 'active', 'archived'),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Documents Collection

\`\`\`
{
  _id: ObjectId,
  projectId: ObjectId (ref: Projects),
  title: String (required),
  type: String (enum: 'brief', 'prd', 'techDoc'),
  content: Object,
  createdBy: ObjectId (ref: Users),
  updatedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### RefreshTokens Collection

\`\`\`
{
  _id: ObjectId,
  token: String (required),
  user: ObjectId (ref: Users),
  expiresAt: Date,
  createdAt: Date
}
\`\`\`

## Authentication Flow

1. **Registration**:
   - Validate user input
   - Check if email already exists
   - Hash password
   - Create user document
   - Generate JWT and refresh token
   - Return tokens to client

2. **Login**:
   - Validate credentials
   - Compare password hash
   - Generate JWT and refresh token
   - Update lastLoginAt
   - Return tokens to client

3. **Token Refresh**:
   - Validate refresh token
   - Check if token exists and not expired
   - Generate new JWT
   - Return new JWT to client

4. **Logout**:
   - Invalidate refresh token
   - Remove from RefreshTokens collection

## Authorization System

- **Role-Based Access Control**:
  - User roles: 'user', 'admin'
  - Project roles: 'viewer', 'editor', 'admin'

- **Permission Checks**:
  - Middleware for route protection
  - Project access validation
  - Document access validation

## Error Handling

- **Standardized Error Responses**:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (authentication required)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (resource doesn't exist)
  - 409: Conflict (resource already exists)
  - 500: Internal Server Error

- **Error Logging**:
  - Structured error logs
  - Error monitoring with Sentry
  - Detailed internal errors, sanitized external responses

## Data Validation

- **Input Validation**:
  - Schema-based validation with Joi or Zod
  - Sanitization of user inputs
  - Type checking and conversion

- **Output Validation**:
  - Consistent response structure
  - Data transformation before sending to client

## Caching Strategy

- **Redis Cache**:
  - Cache frequently accessed data
  - Cache invalidation on updates
  - TTL-based expiration

- **Cache Layers**:
  - API response caching
  - Database query caching
  - Session caching

## Security Measures

- **Data Protection**:
  - HTTPS for all communications
  - Sensitive data encryption
  - Password hashing with bcrypt

- **API Security**:
  - Rate limiting
  - CORS configuration
  - CSRF protection
  - Input validation

- **Database Security**:
  - Principle of least privilege
  - Query parameterization
  - Regular security audits`;
}
