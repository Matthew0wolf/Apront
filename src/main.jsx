import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';

import { RundownProvider } from '@/contexts/RundownContext.jsx';
import { TimerProvider } from '@/contexts/TimerContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { SyncProvider } from '@/contexts/SyncContext.jsx';
import { NotificationsProvider } from '@/contexts/NotificationsContext.jsx';
import { PresenterConfigProvider } from '@/contexts/PresenterConfigContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/contexts/AuthProvider.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <NotificationsProvider>
                <SyncProvider>
                  <PresenterConfigProvider>
                    <TimerProvider>
                      <RundownProvider>
                        <App />
                        <Toaster />
                      </RundownProvider>
                    </TimerProvider>
                  </PresenterConfigProvider>
                </SyncProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);