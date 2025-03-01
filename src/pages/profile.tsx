import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ProfileManager from '../components/ProfileManager';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfilePage: NextPage = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Profile | 021</title>
          <meta name="description" content="Manage your profile settings" />
        </Head>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Your Profile</h1>
          <ProfileManager />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ProfilePage; 