import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from '@/app/App';
import { AuthProvider } from '@/features/auth/context/AuthContext';

import '@/styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
