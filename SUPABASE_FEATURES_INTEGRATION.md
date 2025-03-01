# Supabase Integration for Features

This document outlines the integration of Supabase for storing and managing features in the application.

## Database Setup

The features are stored in two tables in Supabase:

1. `public.features` - Stores individual features
2. `public.feature_sets` - Groups features by brief and stores metadata like key questions

### Table Schema

```sql
-- Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('must', 'should', 'could', 'wont')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_sets table to group features
CREATE TABLE IF NOT EXISTS public.feature_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

Row Level Security is enabled on both tables to ensure that users can only access their own data:

```sql
-- Enable Row Level Security
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for features table
CREATE POLICY "Users can view their own features"
ON public.features FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own features"
ON public.features FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own features"
ON public.features FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own features"
ON public.features FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for feature_sets table
CREATE POLICY "Users can view their own feature sets"
ON public.feature_sets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature sets"
ON public.feature_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature sets"
ON public.feature_sets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feature sets"
ON public.feature_sets FOR DELETE
USING (auth.uid() = user_id);
```

## Feature Service

The `featureService` is a TypeScript service that handles all interactions with the Supabase features tables. It provides methods for:

- Fetching all features for a brief
- Fetching a feature set by brief ID
- Saving a new feature set
- Adding a new feature
- Updating an existing feature
- Deleting a feature
- Deleting all features for a brief

### Feature Interfaces

```typescript
// Interface for the feature in Supabase
export interface SupabaseFeature {
  id: string;
  brief_id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

// Interface for the feature set in Supabase
export interface SupabaseFeatureSet {
  id: string;
  brief_id: string;
  project_id: string;
  user_id: string;
  key_questions: string[];
  created_at: string;
  updated_at: string;
}
```

## Integration with Feature Ideation

The feature ideation process has been updated to use Supabase instead of local storage:

1. When a user generates features, they are saved to Supabase using the `featureService.saveFeatureSet` method
2. When a user edits a feature, the changes are saved to Supabase using the `featureService.updateFeature` method
3. When a user deletes a feature, it is removed from Supabase using the `featureService.deleteFeature` method
4. When a user adds a new feature, it is saved to Supabase using the `featureService.addFeature` method
5. When a user drags a feature to change its priority, the update is saved to Supabase

## Migration from Local Storage

The migration from local storage to Supabase involves:

1. Creating the necessary tables in Supabase
2. Implementing the `featureService` to interact with these tables
3. Updating the feature ideation page to use the `featureService` instead of the `featureStore`
4. Converting between the local feature format and the Supabase feature format

## Usage Examples

### Generating Features

```typescript
// Generate features using OpenAI
const generatedFeatures = await generateFeatures(briefForGenerator);

// Save features to Supabase
const newFeatureSet = await featureService.saveFeatureSet(
  brief.id,
  brief.project_id,
  generatedFeatures,
  [] // Empty key questions for now
);
```

### Updating a Feature

```typescript
// Update in Supabase
await featureService.updateFeature(feature.id, updatedFeature);

// Update local state
const updatedFeatures = featureSet.features.map(f => 
  f.id === feature.id ? updatedFeature : f
);

setFeatureSet({
  ...featureSet,
  features: updatedFeatures
});
```

### Deleting a Feature

```typescript
// Delete from Supabase
await featureService.deleteFeature(featureId);

// Update local state
const updatedFeatures = featureSet.features.filter(f => f.id !== featureId);

setFeatureSet({
  ...featureSet,
  features: updatedFeatures
});
```

## Troubleshooting

- **Authentication Issues**: Make sure the user is authenticated before attempting to access or modify features.
- **Permission Errors**: Check that the RLS policies are correctly set up and that the user ID is being properly passed.
- **Data Not Showing**: Verify that the user ID in the features table matches the authenticated user's ID.
- **Type Errors**: Ensure that the feature data is correctly mapped between the local format and the Supabase format. 