import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import App from './App.tsx';
import './index.css';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { Footer } from './components/Footer.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <NotificationProvider>
        <App />
        <Footer />
      </NotificationProvider>
    </ApolloProvider>
  </StrictMode>
);
