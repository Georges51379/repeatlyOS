import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA / offline support — production only.
// A caching SW sitting on top of Vite's dev server (which serves fresh
// unbundled modules on every change) causes exactly the kind of stale-
// module/"duplicate React instance" crash this was found fixing: the SW
// was caching JS responses that no longer matched what Vite served after
// subsequent edits, and mixing old-cached + freshly-served modules
// produced two live React copies in the same page.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app still works online
    });
  });
}
