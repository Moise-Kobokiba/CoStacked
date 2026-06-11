// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import './styles/global.css';

// Import the Provider component from react-redux and our store
import { Provider } from 'react-redux';
import { store } from './store/store.js';

// --- THIS IS THE UPDATE ---
// Import the ThemeProvider from its new, dedicated file.
import { ThemeProvider } from './context/ThemeProvider';
import { SocketProvider } from './context/SocketProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * The root of our React application.
 * - The <Provider> makes the Redux store available.
 * - The <ThemeProvider> makes the theme state and functions available.
 * - The <App> component handles routing.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);