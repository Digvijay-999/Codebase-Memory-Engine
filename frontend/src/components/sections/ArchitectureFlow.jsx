import React from 'react';
import { Container, Section } from '../ui/Layout';
import { ScrollReveal, ScrollRevealChild } from '../ui/ScrollReveal';
import { motion } from 'framer-motion';

const FLOW_STEPS = [
  { id: 1, title: 'Clone Repo', desc: 'Securely sync source code.' },
  { id: 2, title: 'Parse Codebase', desc: 'Extract AST & semantic blocks.' },
  { id: 3, title: 'Generate Embeddings', desc: 'Vectorize via embedding model.' },
  { id: 4, title: 'Store in Vector DB', desc: 'Index into ChromaDB.' },
  { id: 5, title: 'Context Retrieval', desc: 'Match queries to generate answers.' }
];

export function ArchitectureFlow() {
  return (
    <Section id="architecture" className="bg-surface border-y border-border">
      <Container>
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-eyebrow text-text-muted block mb-4">Pipeline</span>
          <h2 className="text-section text-text-primary mb-6">
            The intelligence pipeline.
          </h2>
          <p className="text-body-large text-text-secondary mx-auto">
            From raw source code to semantic understanding. The backend handles the heavy lifting, giving you instant answers.
          </p>
        </ScrollReveal>

        <div className="relative pt-8 pb-12">
          {/* Animated Connecting line (Desktop) */}
          <div className="hidden md:block absolute top-[64px] left-[10%] right-[10%] h-px bg-surface-elevated z-0 overflow-hidden">
            <motion.div 
              className="h-full bg-border"
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </div>
          
          {/* Animated Connecting line (Mobile) */}
          <div className="md:hidden absolute top-8 bottom-12 left-[39px] w-px bg-surface-elevated z-0 overflow-hidden">
             <motion.div 
              className="w-full bg-border"
              initial={{ scaleY: 0, transformOrigin: 'top' }}
              whileInView={{ scaleY: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </div>

          <ScrollReveal stagger={true} className="relative z-10 flex flex-col md:flex-row justify-between gap-12 md:gap-4">
            {FLOW_STEPS.map((step, idx) => (
              <ScrollRevealChild key={step.id} className="flex md:flex-col items-start md:items-center gap-6 md:gap-8 flex-1 relative group">
                
                {/* Number Circle */}
                <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0 text-text-primary font-mono font-medium transition-colors group-hover:bg-accent group-hover:text-bg group-hover:border-accent">
                  {step.id}
                </div>
                
                {/* Copy */}
                <div className="flex-1 md:text-center mt-1 md:mt-0">
                  <h4 className="text-card-heading text-[24px] text-text-primary mb-2">{step.title}</h4>
                  <p className="text-text-secondary leading-relaxed">{step.desc}</p>
                </div>

              </ScrollRevealChild>
            ))}
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}
