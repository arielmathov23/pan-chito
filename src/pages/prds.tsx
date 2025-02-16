import React from 'react';
import Navbar from '../components/Navbar';
import PRDList from '../components/PRDList';

interface PRD {
  id: string;
  title: string;
  createdAt: string;
}

const PRDsPage = () => {
  const [prds, setPrds] = React.useState<PRD[]>([]);

  const handleDelete = (id: string) => {
    // Add your delete logic here
    setPrds(currentPrds => currentPrds.filter(prd => prd.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">My PRDs</h1>
          <PRDList prds={prds} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
};

export default PRDsPage; 