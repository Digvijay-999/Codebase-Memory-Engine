import React from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { FileText, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MOCK_ARCHITECTURE_REPORT } from '../lib/mockData';

export default function Docs() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Architecture Report: Core Engine</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download size={16} /> Export Markdown
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <article className="prose prose-invert prose-headings:font-heading prose-headings:font-semibold prose-a:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary max-w-none">
              {/* Very basic markdown rendering for the mock */}
              {MOCK_ARCHITECTURE_REPORT.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-4xl text-text-primary mb-8 tracking-tight">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl text-text-primary mt-12 mb-6 border-b border-border pb-4">{line.replace('## ', '')}</h2>;
                if (line.startsWith('- ')) {
                  const content = line.replace('- ', '');
                  const parts = content.split('**');
                  return (
                    <li key={i} className="ml-4 mb-2 list-disc marker:text-text-muted">
                      {parts.length > 1 ? (
                        <><strong>{parts[1]}</strong>{parts[2]}</>
                      ) : content}
                    </li>
                  );
                }
                if (line.match(/^\d+\./)) {
                  const content = line.replace(/^\d+\.\s*/, '');
                  const parts = content.split('**');
                  return (
                    <div key={i} className="flex gap-4 mb-4">
                      <div className="w-6 h-6 rounded bg-surface-elevated border border-border flex items-center justify-center shrink-0 text-sm font-mono text-text-primary">
                        {line.charAt(0)}
                      </div>
                      <p className="mt-0.5">
                        {parts.length > 1 ? (
                          <><strong>{parts[1]}</strong>{parts[2]}</>
                        ) : content}
                      </p>
                    </div>
                  );
                }
                if (!line.trim()) return null;
                return <p key={i} className="mb-4 leading-relaxed">{line}</p>;
              })}
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
