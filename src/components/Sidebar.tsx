import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Archive,
  ArchiveRestore,
  Image as ImageIcon,
  Code2,
  Settings as SettingsIcon,
  ChevronLeft,
  Check,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ConversationSummary } from '../types';

export const Sidebar: React.FC = () => {
  const {
    conversationSummaries,
    conversationGroups,
    currentSession,
    isSidebarOpen,
    setSidebarOpen,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    archiveSession,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    setSettingsOpen,
    setImagineOpen,
    openCanvas,
    activeCanvasArtifact,
  } = useAI();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleStartRename = (session: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete.id, true);
      setSessionToDelete(null);
    }
  };

  // Pinned items (if not showing archived)
  const pinnedConversations = !showArchived
    ? conversationSummaries.filter((c) => c.isPinned)
    : [];

  // Collapsed rail mode
  if (!isSidebarOpen) {
    return (
      <div className="hidden lg:flex flex-col items-center py-6 px-2 w-16 bg-[#0E0E0E] border-r border-[#262626] justify-between shrink-0 z-20">
        <div className="flex flex-col items-center gap-4">
          <button
            id="sidebar-expand-btn"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#333] flex flex-col items-center justify-center hover:border-white/40 transition-all cursor-pointer"
            title="Expand Sidebar"
          >
            <span className="font-serif italic font-bold text-base text-white">HK</span>
          </button>
          <button
            id="sidebar-collapsed-newchat-btn"
            onClick={() => createNewSession()}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New Chat (⌘K)"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            id="sidebar-collapsed-imagine-btn"
            onClick={() => setImagineOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-purple-400 flex items-center justify-center transition-colors cursor-pointer"
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
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Code Canvas"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            id="sidebar-collapsed-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-[#262626] hover:bg-[#222] hover:border-[#444] text-[#888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
        className="fixed lg:static inset-y-0 left-0 z-40 w-72 md:w-[280px] bg-[#0E0E0E] border-r border-[#262626] flex flex-col h-full shrink-0 select-none transition-all p-4 font-sans"
      >
        {/* Editorial Brand Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif italic font-bold tracking-tighter text-white">HK</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#888] font-semibold -mt-1">Samrat AI</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono uppercase bg-[#1A1A1A] border border-[#333] text-blue-400 px-1.5 py-0.5 rounded font-bold">
              PRO
            </span>
            <button
              id="sidebar-collapse-btn"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-[#666] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons & Intelligence Hub */}
        <div className="space-y-2.5 mb-3">
          {/* REQUIREMENT 1: NEW CHAT BUTTON */}
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white text-black hover:bg-[#EAEAEA] text-xs font-bold uppercase tracking-wider transition-all group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              <span>New Chat</span>
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
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] text-[#AAA] hover:text-white text-xs font-medium border border-[#262626] transition-all text-left cursor-pointer"
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
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] text-[#AAA] hover:text-white text-xs font-medium border border-[#262626] transition-all text-left cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">Canvas</span>
            </button>
          </div>
        </div>

        {/* REQUIREMENT 4: SEARCH CHAT HISTORY */}
        <div className="mb-3 space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              id="sidebar-search-chats-input"
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#DDD] placeholder-[#555] focus:outline-none focus:border-[#444]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Archive Toggle Filter */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-[#666] uppercase tracking-wider font-semibold text-[10px]">
              {showArchived ? 'Archived Chats' : 'Chat History'}
            </span>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                showArchived ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : 'text-[#777] hover:text-[#BBB]'
              }`}
              title={showArchived ? 'Show Active Chats' : 'Show Archived Chats'}
            >
              <Archive className="w-3 h-3" />
              <span>{showArchived ? 'Archived' : 'Archive'}</span>
            </button>
          </div>
        </div>

        {/* REQUIREMENT 3: TIME-BASED GROUPED CONVERSATIONS LIST */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar -mr-1 pr-1">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && !showArchived && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-400/90 mb-1.5 font-bold flex items-center gap-1.5 px-1">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </p>
              <div className="space-y-1">
                {pinnedConversations.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Today */}
          {conversationGroups.today && conversationGroups.today.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#666] mb-1.5 font-bold px-1 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5 text-[#555]" />
                <span>Today</span>
              </p>
              <div className="space-y-1">
                {conversationGroups.today.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {conversationGroups.yesterday && conversationGroups.yesterday.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#666] mb-1.5 font-bold px-1 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5 text-[#555]" />
                <span>Yesterday</span>
              </p>
              <div className="space-y-1">
                {conversationGroups.yesterday.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Previous 7 Days */}
          {conversationGroups.previous7Days && conversationGroups.previous7Days.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#666] mb-1.5 font-bold px-1 flex items-center gap-1.5">
                <Calendar className="w-2.5 h-2.5 text-[#555]" />
                <span>Previous 7 Days</span>
              </p>
              <div className="space-y-1">
                {conversationGroups.previous7Days.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Older */}
          {conversationGroups.older && conversationGroups.older.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#666] mb-1.5 font-bold px-1 flex items-center gap-1.5">
                <Calendar className="w-2.5 h-2.5 text-[#555]" />
                <span>Older</span>
              </p>
              <div className="space-y-1">
                {conversationGroups.older.map((conv) => renderConversationItem(conv))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {conversationSummaries.length === 0 && (
            <div className="text-center py-10 px-3 text-[#555] text-xs font-mono">
              {searchQuery ? 'No matching chats found' : showArchived ? 'No archived chats' : 'No saved chats yet'}
            </div>
          )}
        </div>

        {/* Footer Editorial Branding */}
        <div className="pt-3 mt-2 border-t border-[#262626] flex flex-col gap-2">
          <button
            id="sidebar-footer-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#AAA] hover:text-white transition-all group cursor-pointer"
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

          <div className="flex flex-col gap-0.5 text-[10px] font-mono px-1">
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
            <div className="text-[9px] text-[#555] text-center pt-0.5">
              Developed with ❤️ in India 🇮🇳 by Hariom Kushwaha
            </div>
          </div>
        </div>
      </aside>

      {/* REQUIREMENT 5: DELETE CONFIRMATION MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl max-w-sm w-full p-5 shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-9 h-9 rounded-xl bg-red-950/50 border border-red-800/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Chat?</h3>
            </div>
            <p className="text-xs text-[#999] leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">"{sessionToDelete.title}"</span>?
              This will permanently remove the conversation and its message history from your account.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#888] hover:text-white hover:bg-[#222] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderConversationItem(conv: ConversationSummary) {
    const isActive = currentSession?.id === conv.id;
    const isEditing = editingSessionId === conv.id;
    const isMenuOpen = activeMenuId === conv.id;

    if (isEditing) {
      return (
        <form
          key={conv.id}
          onSubmit={(e) => handleSaveRename(conv.id, e)}
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
            className="p-1 text-blue-400 hover:text-blue-300 cursor-pointer"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            className="p-1 text-[#666] hover:text-[#999] cursor-pointer"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={conv.id}
        id={`session-item-${conv.id}`}
        onClick={() => {
          selectSession(conv.id);
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
          ) : conv.isPinned ? (
            <Pin className="w-3 h-3 text-blue-400 shrink-0" />
          ) : (
            <div className="w-1.5 h-1.5 bg-[#333] rounded-full shrink-0 group-hover:bg-[#555]"></div>
          )}
          <span className="truncate">{conv.title || 'New Chat'}</span>
        </div>

        {/* Hover Action Buttons */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
          <button
            id={`pin-btn-${conv.id}`}
            onClick={(e) => {
              e.stopPropagation();
              pinSession(conv.id);
            }}
            className={`p-1 rounded hover:bg-[#262626] ${
              conv.isPinned ? 'text-blue-400' : 'text-[#666] hover:text-white'
            }`}
            title={conv.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin className="w-3 h-3" />
          </button>

          <button
            id={`rename-btn-${conv.id}`}
            onClick={(e) => handleStartRename(conv, e)}
            className="p-1 rounded hover:bg-[#262626] text-[#666] hover:text-white"
            title="Rename Chat"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            id={`archive-btn-${conv.id}`}
            onClick={(e) => {
              e.stopPropagation();
              archiveSession(conv.id, !conv.archived);
            }}
            className="p-1 rounded hover:bg-[#262626] text-[#666] hover:text-white"
            title={conv.archived ? 'Unarchive Chat' : 'Archive Chat'}
          >
            {conv.archived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
          </button>

          <button
            id={`delete-btn-${conv.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setSessionToDelete({ id: conv.id, title: conv.title || 'Untitled' });
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
