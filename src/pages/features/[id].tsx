import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { prdStore } from '../../utils/prdStore';
import { featureService } from '../../services/featureService';
import { briefService } from '../../services/briefService';

export default function FeaturesRedirect() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleRedirect() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // First, determine if the ID is a feature set ID or a brief ID
        const featureSet = await featureService.getFeatureSetById(id as string);
        
        if (featureSet) {
          // If it's a feature set ID, get the brief ID
          const briefId = featureSet.briefId;
          
          // Check if PRDs exist for this brief
          const existingPRDs = prdStore.getPRDs(briefId);
          
          if (existingPRDs.length > 0) {
            // If PRDs exist, redirect to the first PRD
            router.replace(`/prd/${existingPRDs[0].id}`);
          } else {
            // If no PRDs exist, redirect to the ideate page
            router.replace(`/brief/${briefId}/ideate`);
          }
        } else {
          // If it's not a feature set ID, try treating it as a brief ID
          try {
            // Check if PRDs exist for this brief ID
            const existingPRDs = prdStore.getPRDs(id as string);
            
            if (existingPRDs.length > 0) {
              // If PRDs exist, redirect to the first PRD
              router.replace(`/prd/${existingPRDs[0].id}`);
            } else {
              // If no PRDs exist, redirect to the ideate page
              router.replace(`/brief/${id}/ideate`);
            }
          } catch (briefError) {
            console.error('Error handling brief ID:', briefError);
            setError('Invalid ID provided. Could not find a feature set or brief with this ID.');
          }
        }
      } catch (error) {
        console.error('Error in redirect:', error);
        setError('An error occurred while redirecting. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      handleRedirect();
    }
  }, [id, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => router.push('/projects')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {isLoading && (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      )}
    </div>
  );
} 