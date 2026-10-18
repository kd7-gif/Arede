import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import '@fontsource-variable/figtree';
import '@fontsource/bodoni-moda/latin-500.css';
import '@fontsource/bodoni-moda/latin-600.css';
import '@fontsource/bodoni-moda/latin-700.css';
import '@fontsource/bodoni-moda/latin-800.css';
import '@fontsource/bodoni-moda/latin-400-italic.css';
import '@fontsource/bodoni-moda/latin-700-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import { isDemo } from './api/client.js';
import DemoBanner from './components/layout/DemoBanner.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            {isDemo && <DemoBanner />}
            <App />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
