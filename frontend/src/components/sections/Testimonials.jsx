import React from 'react';
import { Container, Section } from '../ui/Layout';
import { ScrollReveal } from '../ui/ScrollReveal';

export function Testimonials() {
  return (
    <Section className="bg-surface/30 border-y border-border">
      <Container>
        <ScrollReveal className="text-center max-w-4xl mx-auto">
          <span className="text-eyebrow text-text-muted block mb-8">
            Why engineering teams choose ContextForge
          </span>
          <h2 className="text-[32px] md:text-[40px] font-heading font-light text-text-secondary leading-tight mb-8 max-w-5xl mx-auto">
            "Codebases grow faster than teams can document them. <br className="hidden md:block"/>
            <span className="text-text-primary font-medium">We built ContextForge to ensure architectural decisions are never lost, and onboarding takes days, not months.</span>"
          </h2>
          <div className="w-16 h-1 bg-border mx-auto rounded-full" />
        </ScrollReveal>
      </Container>
    </Section>
  );
}
