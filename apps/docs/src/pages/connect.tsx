import { JSX, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { APP_STORE_URL } from '../constants';

export const ConnectPage = (): JSX.Element => {
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = APP_STORE_URL;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout title={`Connect - ${siteConfig.title}`} description="Open WhatCode AI on your device">
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <h1>Opening WhatCode AI...</h1>
        <p>If the app does not open automatically, you will be redirected to the App Store.</p>
        <a href={APP_STORE_URL}>Download on the App Store</a>
      </main>
    </Layout>
  );
};

export default ConnectPage;
