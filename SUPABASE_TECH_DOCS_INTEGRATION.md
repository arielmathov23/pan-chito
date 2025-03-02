# Supabase Tech Docs Integration

This document outlines the steps to integrate tech docs with Supabase.

## Table Structure

The `tech_docs` table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS tech_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tech_stack TEXT,
  frontend TEXT,
  backend TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Setup Instructions

1. Navigate to the Supabase dashboard for your project.
2. Go to the SQL Editor.
3. Create a new query and paste the contents of `supabase/migrations/20240101000000_create_tech_docs_table.sql`.
4. Run the query to create the table and set up the necessary policies and triggers.

## Row Level Security (RLS)

The following RLS policies are applied to the `tech_docs` table:

- Users can only select, insert, update, and delete their own tech docs.

## Implementation Details

### Tech Doc Service

The `techDocService` in `src/services/techDocService.ts` provides the following functionality:

- `getTechDocByPrdId`: Get a tech doc by PRD ID
- `getTechDocById`: Get a tech doc by ID
- `saveTechDoc`: Save a tech doc (create or update)
- `deleteTechDoc`: Delete a tech doc
- `deleteAllTechDocsForPRD`: Delete all tech docs for a PRD

### Migration from Local Storage

The implementation includes a migration path from local storage to Supabase:

1. When a user accesses a tech doc, the system first checks Supabase.
2. If the tech doc is not found in Supabase, it checks local storage.
3. If found in local storage, it migrates the tech doc to Supabase.

### Type Definitions

The `TechDoc` interface is defined as follows:

```typescript
export interface TechDoc {
  id: string;
  prdId: string;
  techStack: string;
  frontend: string;
  backend: string;
  createdAt: string;
  updatedAt: string;
  content: {
    platform: {
      targets: string[];
      requirements: string[];
    };
    frontend: any;
    backend: any;
    api: any;
    database: any;
    deployment: any;
  };
}
```

## Testing

After setting up the Supabase table, you should test the integration by:

1. Creating a new tech doc
2. Verifying it's saved to Supabase
3. Updating the tech doc
4. Verifying the updates are saved to Supabase
5. Deleting the tech doc
6. Verifying it's deleted from Supabase

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check the browser console for error messages
2. Verify that the Supabase client is properly initialized
3. Ensure that the user is authenticated
4. Check that the RLS policies are correctly applied
5. Verify that the table structure matches the expected schema 