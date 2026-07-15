import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  Network, 
  GitBranch, 
  Settings 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SIDEBAR_LINKS = [
  { icon: Home, label: 'Overview', path: '/dashboard' },
  { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
  { icon: FileText, label: 'Documentation', path: '/docs' },
  { icon: Network, label: 'Architecture', path: '/architecture' },
  { icon: GitBranch, label: 'Repository', path: '/repository' },
];

export function AppSidebar({ className }) {
  const location = useLocation();

  return (
    <aside className={cn("w-64 border-r border-[#232A32] bg-[#11161C] h-screen flex flex-col", className)}>
      <div className="p-5 border-b border-[#232A32]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shrink-0">
            <div className="w-3.5 h-3.5 bg-[#080B10] rounded-sm" />
          </div>
          <span className="font-heading font-semibold text-[#F3F4F6] tracking-tight truncate text-lg">ContextForge</span>
        </Link>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs font-semibold text-[#8B939E] uppercase tracking-[0.1em]">
          Workspace
        </div>
        <nav className="space-y-1">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-in-out",
                  isActive 
                    ? "bg-white/[0.04] text-white shadow-sm" 
                    : "text-[#8B939E] hover:bg-[#1A2129] hover:text-white"
                )}
              >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-white" : "text-[#8B939E]")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-[#232A32]">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#8B939E] hover:bg-[#1A2129] hover:text-white transition-all duration-150 ease-in-out">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}
