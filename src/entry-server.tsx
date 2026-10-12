import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

/** Renders the initial (locked) page to HTML for the build-time prerender. */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
