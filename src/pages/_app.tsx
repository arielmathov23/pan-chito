import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>021 - From Zero to One</title>
        <link rel="icon" href="data:," />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 