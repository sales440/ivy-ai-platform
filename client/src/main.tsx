import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Minimal, fail-safe entry point for the Cyberpunk Dashboard
const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("FATAL: 'root' element not found in index.html");
} else {
    console.log("Cyberpunk System initializing...");
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    console.log("System initialization complete.");
}
