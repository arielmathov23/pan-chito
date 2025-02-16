import React from 'react';
import Navbar from '../components/Navbar';
import { PRDList } from '../components/PRDList';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <PRDList />
      </main>
    </div>
  );
} 