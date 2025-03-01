# Supabase Integration for Briefs

This document outlines the integration of Supabase for storing and managing briefs in the application.

## Database Setup

The briefs are stored in the `public.briefs` table in Supabase with the following schema:

```sql
CREATE TABLE IF NOT EXISTS public.briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    form_data JSONB NOT NULL,
    brief_data JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_editing BOOLEAN DEFAULT FALSE,
    show_edit_buttons BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

Row Level Security is enabled on the `briefs` table to ensure that users can only access their own briefs:

```sql
-- Enable Row Level Security
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own briefs
CREATE POLICY "Users can view their own briefs"
ON public.briefs
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own briefs
CREATE POLICY "Users can insert their own briefs"
ON public.briefs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own briefs
CREATE POLICY "Users can update their own briefs"
ON public.briefs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own briefs
CREATE POLICY "Users can delete their own briefs"
ON public.briefs
FOR DELETE
USING (auth.uid() = user_id);
```

### Indexes

Indexes are created for faster queries:

```sql
CREATE INDEX IF NOT EXISTS briefs_project_id_idx ON public.briefs(project_id);
CREATE INDEX IF NOT EXISTS briefs_user_id_idx ON public.briefs(user_id);
```

## Brief Service

The `briefService` is a TypeScript service that handles all interactions with the Supabase briefs table. It provides methods for:

- Fetching all briefs for a project
- Fetching a brief by ID
- Creating a new brief
- Updating an existing brief
- Deleting a brief

### Brief Interface

```typescript
export interface Brief {
  id: string;
  project_id: string;
  product_name: string;
  form_data: any;
  brief_data: any;
  user_id: string;
  is_editing: boolean;
  show_edit_buttons: boolean;
  created_at: string;
  updated_at: string;
}
```

### Usage Examples

#### Fetching Briefs for a Project

```typescript
import { briefService } from '../services/briefService';

// Get all briefs for a project
const briefs = await briefService.getBriefsByProjectId(projectId);
```

#### Fetching a Brief by ID

```typescript
import { briefService } from '../services/briefService';

// Get a specific brief by ID
const brief = await briefService.getBriefById(briefId);
```

#### Creating a New Brief

```typescript
import { briefService } from '../services/briefService';

// Create a new brief
const newBrief = await briefService.createBrief(
  projectId,
  formData,
  briefData,
  isEditing,
  showEditButtons
);
```

#### Updating a Brief

```typescript
import { briefService } from '../services/briefService';

// Update an existing brief
await briefService.updateBrief(
  briefId,
  {
    product_name: updatedProductName,
    form_data: updatedFormData,
    brief_data: updatedBriefData,
    is_editing: false,
    show_edit_buttons: true
  }
);
```

#### Deleting a Brief

```typescript
import { briefService } from '../services/briefService';

// Delete a brief
await briefService.deleteBrief(briefId);
```

## Components Updated

The following components have been updated to use the `briefService` instead of the local `briefStore`:

1. `src/pages/brief/new.tsx` - Updated to save briefs to Supabase
2. `src/pages/brief/[id].tsx` - Updated to fetch and update briefs from Supabase
3. `src/components/BriefList.tsx` - Updated to display briefs from Supabase
4. `src/pages/project/[id].tsx` - Updated to fetch briefs for a project from Supabase
5. `src/pages/projects/index.tsx` - Updated to fetch briefs for all projects from Supabase

## Migration Notes

When migrating from the local storage-based `briefStore` to the Supabase-based `briefService`, note the following changes:

1. The brief object structure has changed:
   - `productName` is now `product_name`
   - `briefData` is now `brief_data`
   - `formData` is now `form_data`
   - `createdAt` is now `created_at`
   - `updatedAt` is now `updated_at`

2. All operations are now asynchronous and return Promises, so they need to be awaited.

3. The `briefService` methods handle authentication automatically, using the current user from Supabase Auth.

## Troubleshooting

### Common Issues

1. **Permission Errors**: If you're getting permission errors when trying to access briefs, make sure:
   - The user is authenticated
   - The RLS policies are correctly set up in Supabase
   - The user is trying to access their own briefs

2. **Missing Briefs**: If briefs aren't showing up:
   - Check that the `project_id` is correct
   - Verify that the briefs were created with the correct `user_id`
   - Check the browser console for any errors

3. **Data Format Issues**: If you're seeing errors related to data format:
   - Make sure the `form_data` and `brief_data` are valid JSON objects
   - Check that all required fields are present when creating or updating briefs 