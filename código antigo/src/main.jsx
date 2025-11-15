import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import { RundownProvider } from '@/contexts/RundownContext.jsx';
import { TimerProvider } from '@/contexts/TimerContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { Toaster } from '@/components/ui/toaster';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TimerProvider>
          <RundownProvider>
            <App />
            <Toaster />
          </RundownProvider>
        </TimerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);