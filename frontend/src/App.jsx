import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing'));
const Chat = lazy(() => import('./pages/Chat'));
const Docs = lazy(() => import('./pages/Docs'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#080B10] text-[#8B939E]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading ContextForge...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;