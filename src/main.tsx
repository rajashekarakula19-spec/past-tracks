import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import './index.css';

const App = lazy(() => import('./App'));

function Root() {
  const [showApp, setShowApp] = useState(window.location.hash === '#app');
  const [hasOpenedApp, setHasOpenedApp] = useState(showApp);
  useEffect(() => {
    const onHashChange = () => {
      const openingApp = window.location.hash === '#app';
      setShowApp(openingApp);
      if (openingApp) setHasOpenedApp(true);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('tracking-view', showApp);
    document.documentElement.style.colorScheme = 'light';
    document.title = showApp ? 'PastTracks — Your journeys' : 'PastTracks — Every journey has a story';
    if (showApp || !window.location.hash) window.scrollTo(0, 0);
    if (showApp) requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }, [showApp]);
  return <>
    {!showApp && <LandingPage />}
    {hasOpenedApp && <div hidden={!showApp} aria-hidden={!showApp}><Suspense fallback={<div className="app-loading" role="status">Opening your journey map…</div>}><App /></Suspense></div>}
  </>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>);
