import React from 'react';
import Navbar from '../components/Navbar';
import Account from '../components/Account';
import { withAuth } from '../middleware/withAuth';

const AccountPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Your <span className="animated-gradient-text">021</span> Account
          </h1>
          <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
            Manage your profile settings and preferences to customize your experience
          </p>
        </div>
        <Account />
      </div>
    </div>
  );
};

export default withAuth(AccountPage); 