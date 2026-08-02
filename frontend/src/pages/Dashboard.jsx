import React, { useState, useEffect } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { GitFork, CheckCircle2, Loader2, ArrowRight, RefreshCw, Plus, Circle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (indexingStatus === 'loading') {
      setCurrentStep(0);
      // Advance first two steps to simulate initial processing
      // Since backend doesn't stream progress, we hold at step 2 (Embeddings)
      const timer1 = setTimeout(() => setCurrentStep(1), 1500);
      const timer2 = setTimeout(() => setCurrentStep(2), 3500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
  }, [indexingStatus]);

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

  const STEPS = [
    'Cloning repository',
    'Scanning project files',
    'Generating semantic embeddings',
    'Building vector database',
    'Finalizing workspace'
  ];

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
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-border rounded-xl bg-surface/50 p-8 text-center space-y-6 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">🎉 Your AI workspace is ready</h2>
                  <p className="text-text-secondary text-sm">
                    Your repository has been successfully indexed and is ready for semantic search, AI-assisted documentation and code understanding.
                  </p>
                </div>
                
                <div className="bg-bg border border-border rounded-lg p-5 text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Repository</div>
                    <div className="font-medium text-text-primary flex items-center gap-2 text-sm">
                      <GitFork size={14} className="text-text-secondary" />
                      {repoData.name}
                    </div>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Chunks Indexed</div>
                    <div className="font-medium text-text-primary text-sm">
                      {Number(repoData.chunks).toLocaleString()}
                    </div>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-muted uppercase tracking-wider">Health</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-medium text-text-primary text-sm">Healthy</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button className="w-full gap-2 flex" onClick={() => navigate('/chat')}>
                    Open Workspace <ArrowRight size={16} />
                  </Button>
                  <Button variant="secondary" className="w-full gap-2 flex" onClick={handleReindex}>
                    <RefreshCw size={16} /> Re-index Repository
                  </Button>
                </div>
              </motion.div>
            ) : indexingStatus === 'loading' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-border rounded-xl bg-surface/50 p-8 text-center shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-8 text-lg font-medium text-text-primary">
                  <span className="text-xl">⚙️</span> Building your AI workspace
                </div>
                
                <div className="space-y-4 max-w-[280px] mx-auto text-left mb-10">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const isUpcoming = idx > currentStep;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                          {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
                          {isCurrent && <Loader2 size={16} className="text-accent animate-spin" />}
                          {isUpcoming && <Circle size={14} className="text-text-muted/50" />}
                        </div>
                        
                        <span className={`text-sm transition-colors duration-300 ${isCompleted || isCurrent ? 'text-text-primary font-medium' : 'text-text-muted font-normal'} ${isCurrent ? 'animate-pulse' : ''}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-xs text-text-secondary space-y-1 bg-bg border border-border rounded-lg p-4">
                  <p>This usually takes between 30–90 seconds depending on repository size.</p>
                  <p>Please keep this tab open while indexing completes.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-border rounded-xl bg-surface/50 p-8 shadow-sm"
              >
                <div className="mb-6">
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
                    />
                    <p className="text-xs text-text-muted mt-2 pt-1 leading-relaxed">
                      Connect a public GitHub repository to build an AI workspace.<br/>
                      Initial indexing usually takes 30–90 seconds depending on repository size.
                    </p>
                  </div>

                  {indexingStatus === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 text-center">
                      {progressText}
                    </div>
                  )}

                  <Button 
                    className="w-full gap-2 flex" 
                    onClick={handleIndexRepository}
                    disabled={!repoUrl}
                  >
                    <Plus size={16} />
                    Index Repository
                  </Button>
                </div>
              </motion.div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
