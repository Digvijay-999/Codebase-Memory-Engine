import React from 'react';
import { Container, Section } from '../ui/Layout';
import { ContainerScroll } from '../ui/ContainerScroll';
import { ScrollReveal } from '../ui/ScrollReveal';
import { Folder, File, Terminal, Code2 } from 'lucide-react';
import { MOCK_CHAT_EXCHANGE } from '../../lib/mockData';

export function RepoDemo() {
  const answer = MOCK_CHAT_EXCHANGE[1];

  return (
    <Section id="demo">
      <Container>
        <ContainerScroll
          titleComponent={
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-eyebrow text-text-muted block mb-4">Demo</span>
              <h2 className="text-section text-text-primary mb-6">
                Talk directly to your architecture.
              </h2>
              <p className="text-body-large text-text-secondary mx-auto">
                Stop digging through thousands of files. Ask questions and get answers grounded in specific files and line numbers.
              </p>
            </div>
          }
        >
          {/* Header */}
          <div className="h-12 border-b border-border bg-surface flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
            </div>
            <div className="mx-auto px-4 py-1 rounded-md bg-bg border border-border text-xs text-text-muted font-mono flex items-center gap-2">
              <Terminal size={14} />
              contextforge/core-engine
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row h-[500px]">
            
            {/* Fake File Tree Sidebar */}
            <div className="hidden md:block w-64 border-r border-border bg-surface/50 p-4 overflow-y-auto">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Explorer</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Folder size={16} className="text-text-secondary" /> src
                </div>
                <div className="pl-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <Folder size={16} className="text-text-secondary" /> services
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
                      <File size={16} /> api.ts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-accent bg-surface-elevated px-2 py-1 -mx-2 rounded-md">
                      <Code2 size={16} /> vectorDb.ts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fake Chat Interface */}
            <div className="flex-1 bg-bg p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
              
              {/* User Message */}
              <div className="self-end max-w-[80%] bg-surface-elevated border border-border rounded-2xl rounded-tr-sm p-4 text-text-primary">
                {MOCK_CHAT_EXCHANGE[0].content}
              </div>

              {/* Assistant Message */}
              <div className="self-start max-w-[90%] md:max-w-[80%] text-text-primary">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                    <div className="w-3 h-3 bg-bg rounded-sm" />
                  </div>
                  <span className="font-semibold text-sm">ContextForge</span>
                </div>
                
                <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed">
                  <p>The embedding generation pipeline is configured in <code className="text-text-primary bg-surface px-1.5 py-0.5 rounded border border-border">src/services/vectorDb.ts</code>.</p>
                  <p>For large files, the system uses a semantic chunking strategy that splits documents by AST boundaries rather than raw token limits.</p>
                </div>
                
                {/* Citations block */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Sources Cited</div>
                  <div className="flex flex-col gap-2">
                    {answer.citations.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 bg-surface border border-border rounded-lg p-3 hover:bg-surface-elevated transition-colors cursor-pointer">
                        <File size={16} className="text-text-muted mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-text-primary font-mono">{c.fileId}</div>
                          <div className="text-xs text-text-muted mt-1">Lines {c.lineStart}-{c.lineEnd} • {c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </ContainerScroll>
      </Container>
    </Section>
  );
}
