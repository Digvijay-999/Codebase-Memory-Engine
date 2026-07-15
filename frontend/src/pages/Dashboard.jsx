import React from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { MOCK_REPOSITORIES } from '../lib/mockData';
import { Search, Plus, GitFork, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
          <span className="font-medium text-text-primary">Repositories</span>
          <Button size="sm" className="gap-2">
            <Plus size={16} /> Add Repository
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search repositories..." 
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-secondary transition-colors"
                />
              </div>
            </div>

            {/* Repository List */}
            <div className="border border-border rounded-xl bg-surface/50 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-[40%]">Repository</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-[20%]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-[20%]">Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-[20%]">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_REPOSITORIES.map(repo => (
                    <tr key={repo.id} className="hover:bg-surface transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-bg border border-border flex items-center justify-center text-text-secondary group-hover:text-text-primary transition-colors">
                            <GitFork size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{repo.name}</div>
                            <div className="text-xs text-text-muted">{repo.language}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {repo.status === 'indexed' ? (
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Indexed
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Loader2 size={16} className="text-accent animate-spin" />
                            Indexing...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                        {repo.fileCount.toLocaleString()} files
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Clock size={14} className="text-text-muted" />
                          {repo.lastUpdated}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
