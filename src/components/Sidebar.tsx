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
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { ConversationSummary } from '../types';
import { HKLogo } from './HKLogo';

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
      <div className="hidden lg:flex flex-col items-center py-5 px-2 w-16 bg-[#09090C] border-r border-white/[0.08] justify-between shrink-0 z-20 select-none">
        <div className="flex flex-col items-center gap-3.5">
          <button
            id="sidebar-expand-btn"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] flex items-center justify-center hover:border-amber-500/40 transition-all cursor-pointer p-1"
            title="Expand Sidebar"
          >
            <HKLogo size={28} />
          </button>

          <button
            id="sidebar-collapsed-newchat-btn"
            onClick={() => createNewSession()}
            className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] hover:bg-[#1A1A22] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New Chat (⌘K)"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>

          <button
            id="sidebar-collapsed-imagine-btn"
            onClick={() => setImagineOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] hover:bg-[#1A1A22] text-neutral-400 hover:text-pink-400 flex items-center justify-center transition-colors cursor-pointer"
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
                  code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #070709; color: #EDEDED; }\n    .box { text-align: center; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: #111116; }\n    h1 { font-size: 24px; margin-bottom: 8px; font-weight: 700; }\n  </style>\n</head>\n<body>\n  <div class="box">\n    <h1>HK Samrat AI Canvas Ready</h1>\n    <p style="color: #888; font-size: 14px;">Ask HK Samrat AI to generate web apps, components, animations, or SVGs to preview here.</p>\n  </div>\n</body>\n</html>',
                });
              }
            }}
            className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] hover:bg-[#1A1A22] text-neutral-400 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Code Canvas"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            id="sidebar-collapsed-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] hover:bg-[#1A1A22] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="app-sidebar"
        className="fixed lg:static inset-y-0 left-0 z-40 w-72 md:w-[280px] bg-[#09090C] border-r border-white/[0.08] flex flex-col h-full shrink-0 select-none transition-all p-4 font-sans"
      >
        {/* Brand Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HKLogo size={34} />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                HK SAMRAT AI
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO
                </span>
              </h2>
              <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 -mt-0.5">
                HK Tech World
              </p>
            </div>
          </div>

          <button
            id="sidebar-collapse-btn"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons & Intelligence Hub */}
        <div className="space-y-2 mb-3">
          {/* New Chat Button */}
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono font-normal">
              ⌘K
            </span>
          </button>

          {/* Quick Studio Features */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="sidebar-imagine-studio-btn"
              onClick={() => {
                setImagineOpen(true);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121217] hover:bg-[#1A1A22] text-neutral-300 hover:text-white text-xs font-medium border border-white/[0.08] transition-all text-left cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="text-[11px]">Imagine</span>
            </button>
            <button
              id="sidebar-canvas-btn"
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
                if (activeCanvasArtifact) {
                  openCanvas(activeCanvasArtifact);
                } else {
                  openCanvas({
                    title: 'Live Interactive Canvas',
                    type: 'html',
                    code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #070709; color: #EDEDED; }\n    .box { text-align: center; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: #111116; }\n    h1 { font-size: 24px; margin-bottom: 8px; font-weight: 700; }\n  </style>\n</head>\n<body>\n  <div class="box">\n    <h1>HK Samrat AI Canvas Ready</h1>\n    <p style="color: #888; font-size: 14px;">Ask HK Samrat AI to generate web apps, components, animations, or SVGs to preview here.</p>\n  </div>\n</body>\n</html>',
                  });
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121217] hover:bg-[#1A1A22] text-neutral-300 hover:text-white text-xs font-medium border border-white/[0.08] transition-all text-left cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px]">Canvas</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#121217] border border-white/[0.08] focus:border-amber-500/40 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-neutral-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                <Pin className="w-3 h-3 fill-amber-400/40" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((c) => renderSessionItem(c))}
              </div>
            </div>
          )}

          {/* Grouped History */}
          {Object.entries(conversationGroups).map(([groupKey, list]) => {
            if (list.length === 0) return null;
            return (
              <div key={groupKey}>
                <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  {groupKey}
                </div>
                <div className="space-y-1">
                  {list.map((c) => renderSessionItem(c))}
                </div>
              </div>
            );
          })}

          {conversationSummaries.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No conversations yet
            </div>
          )}
        </div>

        {/* Bottom Founder & System Status Card */}
        <div className="pt-3 border-t border-white/[0.08] mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#14141A] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
              HK
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-200 truncate">
                Hariom Kushwaha
              </div>
              <div className="text-[10px] text-neutral-500 truncate">
                HK Tech World
              </div>
            </div>
          </div>

          <button
            id="sidebar-settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer shrink-0"
            title="Open Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-sm rounded-2xl bg-[#111116] border border-white/[0.1] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-white">Delete Conversation?</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">"{sessionToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderSessionItem(session: ConversationSummary) {
    const isSelected = currentSession?.id === session.id;
    const isEditing = editingSessionId === session.id;

    if (isEditing) {
      return (
        <div
          key={session.id}
          className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#1A1A22] border border-amber-500/40"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(session.id, e);
              if (e.key === 'Escape') setEditingSessionId(null);
            }}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white focus:outline-none px-1"
          />
          <button
            onClick={(e) => handleSaveRename(session.id, e)}
            className="p-1 text-emerald-400 hover:text-emerald-300"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancelRename}
            className="p-1 text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => {
          selectSession(session.id);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isSelected
            ? 'bg-[#181822] text-white border border-white/[0.12] shadow-xs'
            : 'hover:bg-[#121217] text-neutral-400 hover:text-neutral-200 border border-transparent'
        }`}
      >
        <span className="truncate pr-2 max-w-[170px]">{session.title}</span>

        {/* Hover Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              pinSession(session.id);
            }}
            className={`p-1 rounded-md hover:bg-white/[0.1] text-neutral-400 hover:text-amber-400 ${
              session.isPinned ? 'text-amber-400 fill-amber-400' : ''
            }`}
            title={session.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => handleStartRename(session, e)}
            className="p-1 rounded-md hover:bg-white/[0.1] text-neutral-400 hover:text-white"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSessionToDelete({ id: session.id, title: session.title });
            }}
            className="p-1 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
