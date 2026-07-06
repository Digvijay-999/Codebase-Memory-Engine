import { Terminal, GitBranch, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080b10] pt-20 pb-10 relative">
      <div className="max-w-6xl mx-auto px-6 select-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-14 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-accent">
                <Terminal size={14} />
              </div>
              <span className="font-semibold text-base tracking-tight text-foreground">ContextForge</span>
            </div>
            <p className="text-sm text-[#797f80] max-w-sm font-light leading-relaxed">
              Forge understanding from any codebase. The AI-powered code intelligence platform built for developers.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-[#1b232a] hover:bg-[#3e484e]/40 border border-white/5 flex items-center justify-center text-[#797f80] hover:text-[#d9dbd7] transition-all duration-300">
                <GitBranch size={15} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#1b232a] hover:bg-[#3e484e]/40 border border-white/5 flex items-center justify-center text-[#797f80] hover:text-[#d9dbd7] transition-all duration-300">
                <MessageCircle size={15} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-xs tracking-widest uppercase text-[#d9dbd7] mb-5">Product</h4>
            <ul className="space-y-3 text-xs text-[#797f80] font-light">
              <li><a href="#features" className="hover:text-[#d9dbd7] transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-[#d9dbd7] transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs tracking-widest uppercase text-[#d9dbd7] mb-5">Resources</h4>
            <ul className="space-y-3 text-xs text-[#797f80] font-light">
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#d9dbd7] transition-colors">Community</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#797f80] font-light">
          <p>© {new Date().getFullYear()} ContextForge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#d9dbd7] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#d9dbd7] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
