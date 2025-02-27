import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { prdStore } from '../../utils/prdStore';

export default function FeaturesRedirect() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Check if PRDs exist for this brief
      const existingPRDs = prdStore.getPRDs(id as string);
      
      if (existingPRDs.length > 0) {
        // If PRDs exist, redirect to the first PRD
        router.replace(`/prd/${existingPRDs[0].id}`);
      } else {
        // If no PRDs exist, redirect to the ideate page
        router.replace(`/brief/${id}/ideate`);
      }
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F533A] mx-auto mb-4"></div>
        <p className="text-[#4b5563]">Redirecting...</p>
      </div>
    </div>
  );
} 