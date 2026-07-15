import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { ArchitectureFlow } from '../components/sections/ArchitectureFlow';
import { RepoDemo } from '../components/sections/RepoDemo';
import { DeveloperWorkflow } from '../components/sections/DeveloperWorkflow';
import { Testimonials } from '../components/sections/Testimonials';
import { CTA } from '../components/sections/CTA';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-surface-elevated hover:bg-accent hover:text-bg text-text-primary border border-border rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function Landing() {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-text-primary p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-text-secondary mb-6">A rendering error occurred in the layout.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-accent text-bg rounded-md font-medium">Reload Page</button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-bg selection:bg-surface-elevated selection:text-accent">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <ArchitectureFlow />
          <RepoDemo />
          <DeveloperWorkflow />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </ErrorBoundary>
  );
}
