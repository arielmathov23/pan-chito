import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PRDList from '../components/PRDList';
import { prdStore, PRD } from '../utils/prdStore';
import { withAuth } from '../middleware/withAuth';

const PRDsPage = () => {
  const [prds, setPrds] = useState<PRD[]>([]);

  useEffect(() => {
    const allPRDs = prdStore.getPRDs();
    setPrds(allPRDs);
  }, []);

  const handleDelete = (id: string) => {
    // In a real implementation, we would call a delete method on prdStore
    setPrds(currentPrds => currentPrds.filter(prd => prd.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#111827]">My PRDs</h1>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
            <PRDList prds={prds} onDelete={handleDelete} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(PRDsPage); 