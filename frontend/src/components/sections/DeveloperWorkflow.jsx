import React from 'react';
import { Container, Section } from '../ui/Layout';
import { ScrollReveal, ScrollRevealChild } from '../ui/ScrollReveal';
import { motion } from 'framer-motion';

const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'Sync Repository',
    desc: 'Connect your Git provider. We clone and parse the repository, extracting the raw AST and logic.'
  },
  {
    number: '02',
    title: 'Ask Questions',
    desc: 'Query the codebase using natural language. "Where is auth handled?" or "How do payments flow?"'
  },
  {
    number: '03',
    title: 'Get Grounded Answers',
    desc: 'Receive precise answers backed by exact file paths and line numbers, never hallucinations.'
  },
  {
    number: '04',
    title: 'Generate Artifacts',
    desc: 'Export high-level architecture reports or README files based on the actual ground truth.'
  }
];

export function DeveloperWorkflow() {
  return (
    <Section className="border-t border-border bg-bg overflow-visible">
      <Container>
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-eyebrow text-text-muted block mb-4">Workflow</span>
          <h2 className="text-section text-text-primary mb-6">
            The developer workflow.
          </h2>
          <p className="text-body-large text-text-secondary mx-auto">
            Built for engineering teams who need to move fast without breaking the architecture.
          </p>
        </ScrollReveal>

        <ScrollReveal stagger={true} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {WORKFLOW_STEPS.map((step) => (
            <ScrollRevealChild key={step.number} className="flex flex-col group relative">
              {/* Number Circle */}
              <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0 text-text-primary font-mono font-medium transition-colors group-hover:bg-accent group-hover:text-bg group-hover:border-accent mb-8">
                {step.number}
              </div>
              
              <div className="relative pt-6 border-t border-border">
                {/* Animated Accent Line */}
                <motion.div 
                  className="absolute top-[-1px] left-0 h-[1px] bg-text-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: 32 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                />
                
                <h4 className="text-card-heading text-[24px] text-text-primary mb-2">{step.title}</h4>
                <p className="text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            </ScrollRevealChild>
          ))}
        </ScrollReveal>
      </Container>
    </Section>
  );
}
