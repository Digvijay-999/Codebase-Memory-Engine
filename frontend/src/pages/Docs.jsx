import React, { useState, useEffect } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Docs() {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [repoName, setRepoName] = useState('Core Engine');

  const handleExport = () => {
    const isInvalidReport = !report || report.startsWith('**Error') || report.includes('No repositories') || report === 'No documentation generated.';
    if (isInvalidReport) return;

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeRepoName = repoName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.download = `${safeRepoName}-architecture-report.md`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const currentRepo = localStorage.getItem('repo_name');
        console.log('Selected repository:', currentRepo);
        
        if (currentRepo) {
          setRepoName(currentRepo);
          console.log('Sending repo_name to backend:', currentRepo);
          const data = await api.explainRepo(currentRepo);
          setReport(data.explanation || 'No documentation generated.');
        } else {
          setRepoName('None');
          setReport('No repositories available to generate documentation from.');
        }
        } catch (error) {
        console.error(error);
        setReport(`**Error generating documentation:** ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Architecture Report: {repoName}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={handleExport}
            disabled={loading || !report || report.startsWith('**Error') || report.includes('No repositories') || report === 'No documentation generated.'}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Markdown
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
                <p className="text-text-muted">Generating documentation...</p>
              </div>
            ) : (
              <article className="prose prose-invert prose-headings:font-heading prose-headings:font-semibold prose-a:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4 w-full"><table className="min-w-full divide-y divide-[#232A32] border border-[#232A32] rounded-lg" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-[#1A2129]" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="divide-y divide-[#232A32]" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-[#1A2129]/50 transition-colors" {...props} />,
                    th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B939E] uppercase tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-[#C8CDD4]" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-[#1A2129] p-4 rounded-xl border border-[#232A32] overflow-x-auto my-4 text-sm w-full" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-4xl text-text-primary mb-8 tracking-tight" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl text-text-primary mt-12 mb-6 border-b border-border pb-4" {...props} />
                  }}
                >
                  {report}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
