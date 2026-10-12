import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered (see scripts/prerender.mjs); the dev server serves an empty root.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
