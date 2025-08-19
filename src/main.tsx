import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';
import App from './App.tsx';
import './index.css';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { Footer } from './components/Footer.tsx';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { SonnerToaster } from './components/SonnerToaster.tsx';

if (process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages(); // ← Mostra erros reais
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <NotificationProvider>
        <SonnerToaster />
        <App />
        <Footer />
      </NotificationProvider>
    </ApolloProvider>
  </StrictMode>
);
