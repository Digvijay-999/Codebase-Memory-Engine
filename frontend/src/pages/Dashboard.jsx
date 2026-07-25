import React, { useState, useEffect } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { GitFork, CheckCircle2, Loader2, ArrowRight, RefreshCw, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [isIndexed, setIsIndexed] = useState(
    localStorage.getItem('repositoryIndexed') === 'true'
  );
  
  const [repoData, setRepoData] = useState({
    name: localStorage.getItem('repo_name') || '',
    chunks: localStorage.getItem('stored_chunks') || 0
  });

  const [repoUrl, setRepoUrl] = useState('');
  const [indexingStatus, setIndexingStatus] = useState('idle'); // idle, loading, success, error
  const [progressText, setProgressText] = useState('');



  const handleIndexRepository = async () => {
    if (!repoUrl) return;
    setIndexingStatus('loading');
    setProgressText('Indexing repository... This may take a few minutes.');
    
    try {
      const response = await api.indexRepository(repoUrl);

      if (response.success && response.repo_name) {
        localStorage.setItem('repo_name', response.repo_name);
        localStorage.setItem('repositoryIndexed', 'true');
        localStorage.setItem('stored_chunks', response.stored_chunks || 0);
        
        setRepoData({
          name: response.repo_name,
          chunks: response.stored_chunks || 0
        });
        
        setIsIndexed(true);
        setIndexingStatus('success');
      } else {
        setIndexingStatus('error');
      }
    } catch (error) {
      console.error(error);
      setIndexingStatus('error');
      setProgressText(error.message || 'Failed to index repository. Please check the URL or backend.');
    } finally {
      if (indexingStatus === 'loading') {
          // just as a fallback if state wasn't updated
      }
    }
  };

  const handleReindex = () => {
    localStorage.removeItem('repo_name');
    localStorage.removeItem('repositoryIndexed');
    localStorage.removeItem('stored_chunks');
    localStorage.removeItem('chatHistory');
    setIsIndexed(false);
    setIndexingStatus('idle');
    setRepoUrl('');
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
          <span className="font-medium text-text-primary">Workspace Setup</span>
        </header>

        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto">
            
            {isIndexed ? (
              <div className="border border-border rounded-xl bg-surface/50 p-8 text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Repository Ready</h2>
                  <p className="text-text-secondary text-sm">Your codebase is successfully indexed and ready for semantic queries.</p>
                </div>
                
                <div className="bg-bg border border-border rounded-lg p-4 text-left space-y-3">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Repository</div>
                    <div className="font-medium text-text-primary flex items-center gap-2">
                      <GitFork size={16} className="text-text-secondary" />
                      {repoData.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Indexed Chunks</div>
                    <div className="font-medium text-text-primary">
                      {Number(repoData.chunks).toLocaleString()} chunks
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button className="w-full gap-2 flex" onClick={() => navigate('/chat')}>
                    Open AI Workspace <ArrowRight size={16} />
                  </Button>
                  <Button variant="secondary" className="w-full gap-2 flex" onClick={handleReindex}>
                    <RefreshCw size={16} /> Re-index Repository
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-xl bg-surface/50 p-8 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Index Repository</h2>
                  <p className="text-text-secondary text-sm">
                    Enter a public GitHub repository URL to clone, chunk, and embed the codebase into the semantic memory engine.
                  </p>
                </div>
                
                <div className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      GitHub Repository
                    </label>
                    <input 
                      type="text" 
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/user/repo" 
                      className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-secondary transition-colors disabled:opacity-50"
                      disabled={indexingStatus === 'loading'}
                    />
                  </div>

                  {indexingStatus === 'loading' && (
                    <div className="flex flex-col items-center justify-center p-6 bg-bg border border-border rounded-lg space-y-3">
                      <Loader2 size={24} className="text-accent animate-spin" />
                      <span className="text-sm text-text-secondary animate-pulse">{progressText}</span>
                    </div>
                  )}

                  {indexingStatus === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 text-center">
                      {progressText}
                    </div>
                  )}

                  <Button 
                    className="w-full gap-2 flex" 
                    onClick={handleIndexRepository}
                    disabled={!repoUrl || indexingStatus === 'loading'}
                  >
                    {indexingStatus === 'loading' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Index Repository
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
