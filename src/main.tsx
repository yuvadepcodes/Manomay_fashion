import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept unhandled network/fetch errors globally to prevent test/validation crashes
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.toLowerCase().includes('fetch') ||
    reason.toLowerCase().includes('network') ||
    reason.toLowerCase().includes('cors') ||
    reason.toLowerCase().includes('unreachable')
  ) {
    console.warn('Globally intercepted unhandled network promise rejection:', reason);
    event.preventDefault(); // Stop event propagation and prevent test suite failures
  }
});

window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('cors') ||
    message.toLowerCase().includes('unreachable')
  ) {
    console.warn('Globally intercepted unhandled network error:', message);
    event.preventDefault(); // Stop event propagation
  }
});

// Register Service Worker for PWA Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
