import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import PRDList from '../components/PRDList';
import { prdStore, PRD } from '../utils/prdStore';

export default function Dashboard() {
  const [prds, setPrds] = useState<PRD[]>([]);
  
  useEffect(() => {
    const allPRDs = prdStore.getPRDs();
    setPrds(allPRDs);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">My PRDs</h1>
          <div className="bg-card rounded-xl border border-border/40 shadow-card p-6">
            <PRDList prds={prds} />
          </div>
        </div>
      </main>
    </div>
  );
} 