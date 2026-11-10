import { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { FileText, Download, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { convertSafeHtmlToMarkdown, resolveLinkHref, resolveImageSrc } from '../lib/markdownUtils';

export default function Docs() {
  const [repoName, setRepoName] = useState(() => localStorage.getItem('repo_name') || 'Core Engine');
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem('repo_url') || '');
  const [report, setReport] = useState(() => {
    const cur = localStorage.getItem('repo_name');
    if (!cur) return '';
    return sessionStorage.getItem(`docs_report_${cur}`) || '';
  });
  const [loading, setLoading] = useState(() => {
    const cur = localStorage.getItem('repo_name');
    if (!cur) return false;
    return !sessionStorage.getItem(`docs_report_${cur}`);
  });
  const [errorMsg, setErrorMsg] = useState('');
  const activeControllerRef = useRef(null);

  const fetchDocs = async (forceRefresh = false) => {
    const currentRepo = localStorage.getItem('repo_name');
    if (!currentRepo) {
      setRepoName('None');
      setReport('No repositories available to generate documentation from.');
      setLoading(false);
      return;
    }

    setRepoName(currentRepo);
    setErrorMsg('');

    if (!forceRefresh) {
      const cached = sessionStorage.getItem(`docs_report_${currentRepo}`);
      if (cached) {
        setReport(cached);
        setLoading(false);
        return;
      }
    }

    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setLoading(true);
    try {
      const data = await api.explainRepo(currentRepo, { signal: controller.signal });
      if (data && data.repo_url) {
        setRepoUrl(data.repo_url);
        localStorage.setItem('repo_url', data.repo_url);
      }
      const explanation = data.explanation || 'No documentation generated.';
      setReport(explanation);
      sessionStorage.setItem(`docs_report_${currentRepo}`, explanation);
    } catch (error) {
      if (error.message === 'Request was cancelled.') {
        return;
      }
      console.error(error);
      const msg = error.message || 'Unknown error occurred';
      setErrorMsg(msg);
      setReport(`**Error generating documentation:** ${msg}`);
    } finally {
      if (activeControllerRef.current === controller) {
        setLoading(false);
        activeControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount: the state set here is the cached report or the loading flag
    fetchDocs(false);
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

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

  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-text-secondary" />
            <span className="font-medium text-text-primary">Architecture Report: {repoName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => fetchDocs(true)}
              disabled={loading || repoName === 'None'}
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              Regenerate
            </Button>
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
                <p className="text-text-muted">Generating architecture documentation...</p>
                <p className="text-xs text-text-muted/60 mt-1">Analyzing repository components and modules...</p>
              </div>
            ) : errorMsg ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center my-8">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-text-primary mb-2">Architecture Report Generation Failed</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">{errorMsg}</p>
                <Button variant="outline" size="sm" onClick={() => fetchDocs(true)} className="gap-2">
                  <RotateCw size={14} />
                  Retry Generation
                </Button>
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
                    h2: ({node, ...props}) => <h2 className="text-2xl text-text-primary mt-12 mb-6 border-b border-border pb-4" {...props} />,
                    a: ({node, href, ...props}) => {
                      const finalHref = resolveLinkHref(href, repoUrl);
                      return (
                        <a
                          className="text-[#4ADE80] hover:underline"
                          href={finalHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      );
                    },
                    img: ({node, src, alt, ...props}) => {
                      const finalSrc = resolveImageSrc(src, repoUrl);
                      return (
                        <img
                          className="rounded-lg max-h-48 max-w-full my-4 mx-auto object-contain block border border-[#232A32] bg-[#1A2129]/40 p-2"
                          src={finalSrc}
                          alt={alt || ''}
                          loading="lazy"
                          {...props}
                        />
                      );
                    }
                  }}
                >
                  {convertSafeHtmlToMarkdown(report)}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
