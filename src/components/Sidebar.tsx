import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Sparkles,
  Image as ImageIcon,
  Code2,
  Settings as SettingsIcon,
  ChevronLeft,
  Bot,
  Zap,
  Layers,
  Share2,
  Check,
  X,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ChatSession } from '../types';

export const Sidebar: React.FC = () => {
  const {
    sessions,
    currentSession,
    isSidebarOpen,
    setSidebarOpen,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    setSettingsOpen,
    setImagineOpen,
    openCanvas,
    activeCanvasArtifact,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(sessionId, editTitle);
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  if (!isSidebarOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-6 px-2 w-16 bg-[#0E0E0E] border-r border-[#262626] justify-between shrink-0 z-20">
        <div className="flex flex-col items-center gap-4">
          <button
            id="sidebar-expand-btn"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#333] flex flex-col items-center justify-center hover:border-white/40 transition-all"
            title="Expand Sidebar"
          >
            <span className="font-serif italic font-bold text-base text-white">HK</span>
          </button>
          <button
            id="sidebar-collapsed-newchat-btn"
            onClick={() => createNewSession()}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-white flex items-center justify-center transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            id="sidebar-collapsed-imagine-btn"
            onClick={() => setImagineOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-purple-400 flex items-center justify-center transition-colors"
            title="Imagine Studio"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            id="sidebar-collapsed-canvas-btn"
            onClick={() => {
              if (activeCanvasArtifact) {
                openCanvas(activeCanvasArtifact);
              } else {
                openCanvas({
                  title: 'Live Interactive Canvas',
                  type: 'html',
                  code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0A0A0A; color: #F5F5F5; }\n    .box { text-align: center; padding: 2rem; border: 1px solid #262626; border-radius: 12px; background: #111111; }\n    h1 { font-family: serif; font-style: italic; font-size: 24px; margin-bottom: 8px; }\n  </style>\n</head>\n<body>\n  <div class="box">\n    <h1>HK Samrat AI Canvas Ready</h1>\n    <p style="color: #888; font-size: 14px;">Ask HK Samrat AI to generate web apps, components, animations, or SVGs to preview here.</p>\n  </div>\n</body>\n</html>',
                });
              }
            }}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-blue-400 flex items-center justify-center transition-colors"
            title="Code Canvas"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            id="sidebar-collapsed-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-white flex items-center justify-center transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs z-30 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        id="app-sidebar"
        className="fixed lg:static inset-y-0 left-0 z-40 w-72 md:w-[280px] bg-[#0E0E0E] border-r border-[#262626] flex flex-col h-full shrink-0 select-none transition-all p-5 font-sans"
      >
        {/* Editorial Brand Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-serif italic font-bold tracking-tighter text-white">HK</h1>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#888] font-semibold -mt-1">Samrat AI</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono uppercase bg-[#1A1A1A] border border-[#333] text-blue-400 px-1.5 py-0.5 rounded font-bold">
              PRO
            </span>
            <button
              id="sidebar-collapse-btn"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-[#666] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons & Intelligence Hub */}
        <div className="space-y-3 mb-4">
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-black hover:bg-[#E5E5E5] text-xs font-black uppercase tracking-widest transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </div>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono font-normal">⌘K</span>
          </button>

          {/* Quick Studio Features */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="sidebar-imagine-studio-btn"
              onClick={() => {
                setImagineOpen(true);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] text-[#AAA] hover:text-white text-xs font-medium border border-[#262626] transition-all text-left"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-[11px]">Imagine</span>
            </button>
            <button
              id="sidebar-live-canvas-btn"
              onClick={() => {
                if (activeCanvasArtifact) {
                  openCanvas(activeCanvasArtifact);
                } else {
                  openCanvas({
                    title: 'Live Interactive Canvas',
                    type: 'html',
                    code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0A0A0A; color: #F5F5F5; }\n    .card { background: #111; padding: 2rem; border-radius: 16px; border: 1px solid #262626; max-width: 400px; text-align: center; }\n    h2 { margin: 0 0 10px; color: #FFF; font-family: serif; font-style: italic; font-size: 22px; }\n    p { color: #888; font-size: 13px; line-height: 1.5; }\n    button { margin-top: 15px; background: #FFF; border: none; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>HK Samrat Live Canvas</h2>\n    <p>Ask HK Samrat AI in chat to build any React, HTML, CSS, SVG or JS project and view live rendering here.</p>\n    <button onclick="alert(\'HK Samrat AI Interactive Canvas Active!\')">Run Interactive Preview</button>\n  </div>\n</body>\n</html>',
                  });
                }
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] text-[#AAA] hover:text-white text-xs font-medium border border-[#262626] transition-all text-left"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">Canvas</span>
            </button>
          </div>
        </div>

        {/* Search Chats */}
        <div className="mb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              id="sidebar-search-chats-input"
              type="text"
              placeholder="Search neural history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#DDD] placeholder-[#555] focus:outline-none focus:border-[#444]"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar -mr-1 pr-1">
          {/* Pinned Chats */}
          {pinnedSessions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#555] mb-2 font-bold flex items-center gap-1.5 px-1">
                <Pin className="w-3 h-3 text-blue-400" />
                <span>Pinned History</span>
              </p>
              <div className="space-y-1">
                {pinnedSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Regular Chats */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#555] mb-2 font-bold px-1">
              Neural History
            </p>
            {regularSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="text-center py-6 text-[#555] text-xs font-mono">
                No active logs found
              </div>
            ) : (
              <div className="space-y-1">
                {regularSessions.map((session) => renderSessionItem(session))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Editorial Branding */}
        <div className="pt-4 mt-2 border-t border-[#262626] flex flex-col gap-2.5">
          <button
            id="sidebar-footer-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#AAA] hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-[#222] border border-[#333] flex items-center justify-center font-bold text-[10px] text-white">
                HK
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-[#DDD] group-hover:text-white">
                  Settings & Power
                </div>
              </div>
            </div>
            <SettingsIcon className="w-3.5 h-3.5 text-[#666] group-hover:text-white group-hover:rotate-45 transition-all" />
          </button>

          <div className="flex flex-col gap-1 text-[10px] font-mono px-1">
            <div className="flex items-center justify-between text-[#666]">
              <span>HK Samrat AI Pro</span>
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 underline transition-colors"
                title="Privacy Policy"
              >
                Privacy Policy
              </a>
            </div>
            <div className="text-[9px] text-[#555] text-center">
              Developed with ❤️ in India 🇮🇳 by Hariom Kushwaha
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(session: ChatSession) {
    const isActive = currentSession?.id === session.id;
    const isEditing = editingSessionId === session.id;

    if (isEditing) {
      return (
        <form
          key={session.id}
          onSubmit={(e) => handleSaveRename(session.id, e)}
          className="flex items-center gap-1 p-1 bg-[#1A1A1A] rounded-lg border border-blue-500/50"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 text-blue-400 hover:text-blue-300"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            className="p-1 text-[#666] hover:text-[#999]"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={session.id}
        id={`session-item-${session.id}`}
        onClick={() => {
          selectSession(session.id);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-[#1A1A1A] text-white font-medium border border-[#333]'
            : 'text-[#888] hover:bg-[#141414] hover:text-[#DDD] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isActive ? (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></div>
          ) : session.isPinned ? (
            <Pin className="w-3 h-3 text-blue-400 shrink-0" />
          ) : (
            <div className="w-1.5 h-1.5 bg-[#333] rounded-full shrink-0 group-hover:bg-[#555]"></div>
          )}
          <span className="truncate">{session.title || 'New Session'}</span>
        </div>

        {/* Hover Action Buttons */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
          <button
            id={`pin-btn-${session.id}`}
            onClick={(e) => {
              e.stopPropagation();
              pinSession(session.id);
            }}
            className={`p-1 rounded hover:bg-[#262626] ${
              session.isPinned ? 'text-blue-400' : 'text-[#666] hover:text-white'
            }`}
            title={session.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            id={`rename-btn-${session.id}`}
            onClick={(e) => handleStartRename(session, e)}
            className="p-1 rounded hover:bg-[#262626] text-[#666] hover:text-white"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            id={`delete-btn-${session.id}`}
            onClick={(e) => {
              e.stopPropagation();
              deleteSession(session.id);
            }}
            className="p-1 rounded hover:bg-red-950/40 text-[#666] hover:text-red-400"
            title="Delete Chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
