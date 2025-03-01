# Supabase Integration for Projects

This document outlines the steps to integrate Supabase with your application for project management.

## Setup Instructions

### 1. Create Supabase Tables

Run the following SQL commands in your Supabase SQL Editor to set up the necessary tables and security policies:

```sql
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create projects table
create table public.projects (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  content jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  constraint projects_pkey primary key (id),
  constraint projects_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Create index on user_id
create index if not exists idx_projects_user_id on public.projects using btree (user_id);

-- Create trigger for updated_at
create trigger set_updated_at
before update on projects
for each row
execute function handle_updated_at();

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Create policies
-- Allow users to select only their own projects
create policy "Users can view their own projects"
on public.projects for select
using (auth.uid() = user_id);

-- Allow users to insert their own projects
create policy "Users can insert their own projects"
on public.projects for insert
with check (auth.uid() = user_id);

-- Allow users to update their own projects
create policy "Users can update their own projects"
on public.projects for update
using (auth.uid() = user_id);

-- Allow users to delete their own projects
create policy "Users can delete their own projects"
on public.projects for delete
using (auth.uid() = user_id);
```

### 2. Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Project Service

The project service (`src/services/projectService.ts`) provides the following functions for interacting with the Supabase projects table:

- `getProjects()`: Fetches all projects for the current user
- `getProjectById(id)`: Fetches a specific project by ID
- `createProject(project)`: Creates a new project
- `updateProject(project)`: Updates an existing project
- `deleteProject(id)`: Soft deletes a project by setting `is_archived` to true
- `hardDeleteProject(id)`: Permanently deletes a project

### 4. Authentication Integration

The project service is integrated with Supabase authentication to ensure that:

- Projects are associated with the authenticated user
- Users can only access their own projects
- Row Level Security (RLS) policies enforce data isolation

## Usage Examples

### Creating a Project

```typescript
import { projectService } from '../services/projectService';

// Create a new project
const newProject = await projectService.createProject({
  name: 'My New Project',
  description: 'This is a description of my project',
  content: {} // Additional project data
});
```

### Fetching Projects

```typescript
import { projectService } from '../services/projectService';

// Get all projects for the current user
const projects = await projectService.getProjects();

// Get a specific project
const project = await projectService.getProjectById('project-id');
```

### Updating a Project

```typescript
import { projectService } from '../services/projectService';

// Update a project
const updatedProject = await projectService.updateProject({
  id: 'project-id',
  name: 'Updated Project Name',
  description: 'Updated description'
});
```

### Deleting a Project

```typescript
import { projectService } from '../services/projectService';

// Soft delete (archive) a project
await projectService.deleteProject('project-id');

// Hard delete a project (permanent)
await projectService.hardDeleteProject('project-id');
```

## Next Steps

After setting up the projects table, you may want to migrate other related data to Supabase:

1. Briefs
2. Feature Sets
3. PRDs
4. Screens
5. Technical Documentation

Each of these would follow a similar pattern with their own tables, RLS policies, and service files.

## Troubleshooting

- **Authentication Issues**: Make sure the user is authenticated before attempting to access or modify projects.
- **Permission Errors**: Check that the RLS policies are correctly set up and that the user ID is being properly passed.
- **Data Not Showing**: Verify that the user ID in the projects table matches the authenticated user's ID. 