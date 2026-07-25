import React from 'react';
import { Container, Section } from '../ui/Layout';
import { Button } from '../ui/Button';
import { NeonButton } from '../ui/NeonButton';
import { ScrollReveal } from '../ui/ScrollReveal';
import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <Section className="bg-bg relative">
      {/* Background glow contained within Section bounds safely without clipping content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,var(--surface-nested)_0%,transparent_70%)] opacity-60" />
      </div>

      <Container className="relative z-10 text-center py-24 md:py-32">
        <ScrollReveal>
          <span className="text-eyebrow text-text-muted block mb-4">Get Started</span>
          <h2 className="text-section text-text-primary mb-6 max-w-4xl mx-auto">
            Ready to understand your codebase?
          </h2>
          <p className="text-body-large text-text-secondary mx-auto mb-10">
            Connect your repository and get full architectural visibility in minutes.
          </p>
          <Link to="/dashboard">
            <NeonButton className="px-12">
              Launch Workspace
            </NeonButton>
          </Link>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
