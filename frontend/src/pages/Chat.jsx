import React from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AnimatedAIChat } from '../components/ui/AnimatedAiChat';

export default function Chat() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden selection:bg-surface-elevated selection:text-accent">
      <AppSidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0B]">
        <AnimatedAIChat />
      </main>
    </div>
  );
}
