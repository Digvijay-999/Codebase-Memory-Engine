import React from 'react';
import { Container } from '../ui/Layout';
import { ScrollReveal } from '../ui/ScrollReveal';
import { Code2, GitMerge, MessageSquare, Terminal } from 'lucide-react';

export function TrustedBy() {
  return (
    <section className="py-12 border-y border-border bg-surface/50">
      <Container>
        <div className="flex flex-col items-center gap-8">
          <p className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Works with your stack
          </p>
          
          <ScrollReveal>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale">
              
              <div className="flex items-center gap-2 text-text-primary">
                <Code2 size={28} />
                <span className="font-semibold text-lg tracking-tight">GitHub</span>
              </div>
              
              <div className="flex items-center gap-2 text-text-primary">
                <GitMerge size={28} />
                <span className="font-semibold text-lg tracking-tight">GitLab</span>
              </div>
              
              <div className="flex items-center gap-2 text-text-primary">
                <MessageSquare size={28} />
                <span className="font-semibold text-lg tracking-tight">Slack</span>
              </div>
              
              <div className="flex items-center gap-2 text-text-primary">
                <Terminal size={28} />
                <span className="font-semibold text-lg tracking-tight">VS Code</span>
              </div>
              
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
