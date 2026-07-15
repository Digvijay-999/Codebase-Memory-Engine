import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Hash, Briefcase, Terminal } from 'lucide-react';
import { Container } from '../ui/Layout';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', path: '/#features' },
    { label: 'Integrations', path: '/#integrations' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Changelog', path: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', path: '/docs' },
    { label: 'API Reference', path: '/api' },
    { label: 'Blog', path: '/blog' },
    { label: 'Community', path: '/community' },
  ],
  Company: [
    { label: 'About', path: '/about' },
    { label: 'Careers', path: '/careers' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg pt-80 pb-40">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-40 lg:gap-32 mb-56">
          
          {/* Logo & Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                <div className="w-3 h-3 bg-bg rounded-sm" />
              </div>
              <span className="font-heading font-semibold text-text-primary tracking-tight">ContextForge</span>
            </Link>
            <p className="text-text-secondary max-w-sm mb-6">
              The semantic intelligence platform for modern software repositories. Understand architecture, navigate complexity, and ship faster.
            </p>
            <div className="flex items-center gap-4 text-text-secondary">
              <a href="#" aria-label="Twitter" className="hover:text-text-primary transition-colors">
                <Hash size={20} />
              </a>
              <a href="#" aria-label="GitHub" className="hover:text-text-primary transition-colors">
                <Code2 size={20} />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-text-primary transition-colors">
                <Briefcase size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-text-primary mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-meta">
            &copy; {new Date().getFullYear()} ContextForge Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-meta">
            <Terminal size={14} />
            <span>System operational</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
