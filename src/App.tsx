import React, { useEffect, useRef } from 'react';
import { AIProvider, useAI } from './context/AIContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { InputArea } from './components/InputArea';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CanvasSandbox } from './components/CanvasSandbox';
import { SettingsModal } from './components/SettingsModal';
import { ImagineStudio } from './components/ImagineStudio';

function MainChatLayout() {
  const { currentSession, isGenerating, activeCanvasArtifact, createNewSession } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isGenerating]);

  // Global hotkey listeners (Cmd+K / Ctrl+K for New Chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession]);

  const hasMessages = currentSession && currentSession.messages.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <Header />

        {/* Middle split: Chat feed + optional Canvas Sandbox */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Chat Column */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0A0A0A]">
            {hasMessages ? (
              <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-4">
                  {currentSession.messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-start sm:justify-center items-center py-4 px-2">
                <WelcomeScreen />
              </div>
            )}

            {/* Bottom Input Area */}
            <div className="shrink-0">
              <InputArea />
            </div>
          </div>

          {/* Right Split Canvas Sandbox */}
          {activeCanvasArtifact && <CanvasSandbox />}
        </div>
      </div>

      {/* Modals & Dialogs */}
      <SettingsModal />
      <ImagineStudio />
    </div>
  );
}

export default function App() {
  return (
    <AIProvider>
      <MainChatLayout />
    </AIProvider>
  );
}
