import React from 'react';
import { Container, Section } from '../ui/Layout';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { ScrollReveal, ScrollRevealChild } from '../ui/ScrollReveal';
import { DependencyGraphMotif } from '../graph/DependencyGraphMotif';
import { Search, GitBranch, MessageSquare, FileText, BrainCircuit, History } from 'lucide-react';

const FEATURES = [
  {
    title: 'Semantic Search',
    description: 'Find logic based on intent, not just exact keyword matches across your entire codebase.',
    icon: Search
  },
  {
    title: 'Dependency Graph',
    description: 'Automatically map architectural relationships and data flow between microservices.',
    icon: GitBranch
  },
  {
    title: 'AI Chat with Codebase',
    description: 'Ask complex technical questions and get answers grounded in specific files and lines of code.',
    icon: MessageSquare
  },
  {
    title: 'Documentation Generation',
    description: 'Generate accurate, up-to-date architecture reports and READMEs directly from the source truth.',
    icon: FileText
  },
  {
    title: 'Architecture Reports',
    description: 'Identify risks, anti-patterns, and unhandled edge cases across large codebases automatically.',
    icon: BrainCircuit
  },
  {
    title: 'Repository Memory',
    description: 'Persist architectural decisions and context over time, reducing onboarding friction for new hires.',
    icon: History
  }
];

export function Features() {
  return (
    <Section id="features" className="relative overflow-hidden">
      {/* Background Motif */}
      <DependencyGraphMotif className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl" />

      <Container className="relative z-10">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-section text-text-primary mb-6">
            Everything you need to understand scale.
          </h2>
          <p className="text-body-large text-text-secondary mx-auto">
            ContextForge processes your repositories into an intelligent vector graph, giving you unprecedented visibility into your architecture.
          </p>
        </ScrollReveal>

        <ScrollReveal stagger={true} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <ScrollRevealChild key={idx}>
              <motion.div
                whileHover={{ y: -4, borderColor: 'var(--text-secondary)' }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col p-0 overflow-hidden bg-surface group relative border-border">
                  {/* Abstract dark-gradient panel for visual */}
                  <div className="h-32 w-full bg-[radial-gradient(ellipse_at_top,_var(--surface-nested)_0%,_transparent_70%)] opacity-50 transition-opacity group-hover:opacity-100 relative overflow-hidden">
                    {/* Subtle line art/glow */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-10 -mt-10">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center mb-6 text-accent shadow-sm">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-card-heading text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </ScrollRevealChild>
          ))}
        </ScrollReveal>
      </Container>
    </Section>
  );
}
