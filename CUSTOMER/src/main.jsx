import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { HotelSettingsProvider } from './context/HotelSettingsContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <HotelSettingsProvider>
          <App />
        </HotelSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
