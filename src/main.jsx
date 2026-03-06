import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

// Register Service Worker for PWA capabilities (notifications + installability)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw-notify.js')
            .catch((err) => console.warn('[SW] Registration failed:', err));
    });
}
