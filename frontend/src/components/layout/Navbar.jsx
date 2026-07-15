import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../ui/Button';

const NAV_ITEMS = [
  { label: 'Product', path: '/', id: 'hero' },
  { label: 'Features', path: '/#features', id: 'features' },
  { label: 'How It Works', path: '/#architecture', id: 'architecture' },
  { label: 'Demo', path: '/#demo', id: 'demo' },
  { label: 'GitHub', path: 'https://github.com', id: 'github', external: true },
];

export function Navbar() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Handle Scroll for appearing
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Active Section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visibleEntries[0].target.id);
        } else if (window.scrollY < 100) {
           setActiveSection('hero');
        }
      },
      { rootMargin: '-20% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    NAV_ITEMS.forEach(item => {
      if (!item.external) {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const currentPath = location.pathname + location.hash;

  return (
    <AnimatePresence>
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: scrolled ? 0 : -100, opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
      >
        <div className="w-full max-w-[1240px]">
          <nav className="pointer-events-auto flex items-center justify-between px-6 h-[72px] rounded-full bg-[#11161C]/80 backdrop-blur-md border border-[#232A32] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-[#080B10] rounded-sm" />
              </div>
              <span className="font-heading font-semibold text-[#F3F4F6] tracking-tight text-lg">ContextForge</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center h-full gap-2 relative">
              {NAV_ITEMS.map((item, index) => {
                const isPathMatch = currentPath === item.path || (item.path === '/' && currentPath === '');
                const isActive = activeSection === item.id || isPathMatch;
                
                const linkContent = (
                  <>
                    <span className="relative z-10">{item.label}</span>
                    
                    {/* Active Soft White Glow Indicator */}
                    {isActive && !reducedMotion && (
                      <motion.div
                        layoutId="nav-active-glow"
                        className="absolute inset-0 bg-white/[0.04] rounded-full shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {isActive && reducedMotion && (
                      <div className="absolute inset-0 bg-white/[0.04] rounded-full shadow-[0_0_12px_rgba(255,255,255,0.05)]" />
                    )}

                    {/* Hover Smooth Underline Indicator */}
                    {hoveredIndex === index && !isActive && !reducedMotion && (
                      <motion.div
                        layoutId="nav-hover-line"
                        className="absolute bottom-1 left-4 right-4 h-[1px] bg-white/30"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </>
                );

                const linkClasses = `relative px-4 py-2 text-[15px] font-medium transition-all duration-300 rounded-full flex items-center justify-center ${
                  isActive ? 'text-[#F3F4F6]' : 'text-[#7B838C] hover:text-[#F3F4F6]'
                }`;

                if (item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClasses}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {linkContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={linkClasses}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {linkContent}
                  </Link>
                );
              })}
            </div>

            {/* CTA & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <Link to="/chat" className="hidden md:block">
                <button className="bg-white text-[#080B10] hover:bg-[#F3F4F6] transition-colors font-medium text-[15px] px-5 py-2 rounded-full border-none outline-none">
                  Launch Workspace
                </button>
              </Link>
              
              <button 
                className="md:hidden text-[#7B838C] hover:text-[#F3F4F6] transition-colors pointer-events-auto p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[80px] left-4 right-4 p-4 bg-[#11161C]/95 backdrop-blur-xl border border-[#232A32] rounded-2xl shadow-xl md:hidden flex flex-col gap-4 pointer-events-auto"
            >
              {NAV_ITEMS.map((item) => {
                const isPathMatch = currentPath === item.path || (item.path === '/' && currentPath === '');
                const isActive = activeSection === item.id || isPathMatch;
                
                if (item.external) {
                   return (
                    <a
                      key={item.label}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium p-2 rounded-lg transition-colors ${
                        isActive ? 'text-white bg-[#242D34]' : 'text-[#7B838C] hover:text-white hover:bg-[#1B232A]'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium p-2 rounded-lg transition-colors ${
                      isActive ? 'text-white bg-[#242D34]' : 'text-[#7B838C] hover:text-white hover:bg-[#1B232A]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="h-px bg-[#232A32] my-2 w-full" />
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <button className="bg-white text-[#080B10] font-medium text-[16px] w-full py-3 rounded-xl border-none outline-none">
                  Launch Workspace
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </AnimatePresence>
  );
}
