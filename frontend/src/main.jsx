import { StrictMode, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Component to handle global context menu behavior
function AppWithContextMenu() {
  // Memoize the event handler to prevent unnecessary re-creation
  const handleLinkContextMenu = useCallback((event) => {
    // Simplified check for links
    if (event.target.tagName === 'A' || event.target.closest('a')) {
      event.stopPropagation();
      return true;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleLinkContextMenu, true);
    return () => document.removeEventListener('contextmenu', handleLinkContextMenu, true);
  }, [handleLinkContextMenu]);

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithContextMenu />
  </StrictMode>,
)
