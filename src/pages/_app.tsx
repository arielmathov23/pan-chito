import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>021 - From Zero to One</title>
        <link rel="icon" href="data:," />
      </Head>
      <AuthProvider>
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      </AuthProvider>
    </>
  );
}

export default MyApp; 