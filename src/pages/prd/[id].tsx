import React from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import PRDViewer from '../../components/PRDViewer';

export default function PRDDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // TODO: Fetch PRD data based on ID
  const prdContent = "Example PRD Content"; // Replace with actual data fetch

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PRDViewer prdContent={prdContent} />
    </div>
  );
} 