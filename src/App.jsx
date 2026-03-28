import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import { MapSkeleton, GridSkeleton, TimelineSkeleton, DetailSkeleton } from './components/Skeletons';

// Lazy load all pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SourcesPage = lazy(() => import('./pages/SourcesPage'));
const SourceDetail = lazy(() => import('./pages/SourceDetail'));
const CastlesPage = lazy(() => import('./pages/CastlesPage'));
const RoutesPage = lazy(() => import('./pages/RoutesPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-100">
      <div className="text-center">
        <div className="font-arabic text-gold/40 text-3xl mb-3 animate-pulse">الحروب الصليبية</div>
        <div className="w-32 h-0.5 mx-auto rounded-full overflow-hidden bg-ink-200">
          <div className="h-full bg-gold/40 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{ width: '40%', animation: 'shimmer 1.5s ease-in-out infinite alternate' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ink-100">
      {/* Grain overlay — always on */}
      <div className="grain-overlay" />

      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Suspense fallback={<LoadingFallback />}><LandingPage /></Suspense>} />
          <Route path="/map" element={<Suspense fallback={<MapSkeleton />}><MapPage /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><AboutPage /></Suspense>} />
          <Route path="/sources" element={<Suspense fallback={<GridSkeleton />}><SourcesPage /></Suspense>} />
          <Route path="/sources/:id" element={<Suspense fallback={<DetailSkeleton />}><SourceDetail /></Suspense>} />
          <Route path="/castles" element={<Suspense fallback={<GridSkeleton count={8} />}><CastlesPage /></Suspense>} />
          <Route path="/routes" element={<Suspense fallback={<GridSkeleton count={4} />}><RoutesPage /></Suspense>} />
          <Route path="/compare" element={<Suspense fallback={<GridSkeleton />}><ComparePage /></Suspense>} />
          <Route path="/timeline" element={<Suspense fallback={<TimelineSkeleton />}><TimelinePage /></Suspense>} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
