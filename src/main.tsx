import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import './index.css';

const App = lazy(() => import('./App'));

function Root() {
  const [showApp, setShowApp] = useState(window.location.hash === '#app');
  useEffect(() => {
    const onHashChange = () => setShowApp(window.location.hash === '#app');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('tracking-view', showApp);
    document.documentElement.style.colorScheme = showApp ? 'dark' : 'light';
    document.title = showApp ? 'PastTracks — Your journeys' : 'PastTracks — Every journey has a story';
    if (showApp || !window.location.hash) window.scrollTo(0, 0);
  }, [showApp]);
  return showApp ? <Suspense fallback={<div role="status" style={{ padding: 32 }}>Opening your journey map…</div>}><App /></Suspense> : <LandingPage />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>);
