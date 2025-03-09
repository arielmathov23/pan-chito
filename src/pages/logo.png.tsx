import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  // Get the size parameter or use default
  const size = query.size || '200';
  
  // Redirect to the API endpoint
  return {
    redirect: {
      destination: `/api/logo?size=${size}`,
      permanent: false,
    },
  };
};

// This component won't be rendered, but is needed for Next.js
export default function LogoRedirect() {
  return null;
} 