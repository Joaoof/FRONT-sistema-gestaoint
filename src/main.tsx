import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
<<<<<<< HEAD
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
=======
    <AuthProvider>
      <ApolloProvider client={apolloClient}>
        <App />
      </ApolloProvider>
    </AuthProvider>
>>>>>>> 1e228c1 (fix: fix dashboard login)
  </StrictMode>
);
