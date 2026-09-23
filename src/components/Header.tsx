import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  MessageSquarePlus,
  Zap,
  BrainCircuit,
  Globe,
  Code2,
  Image as ImageIcon,
  Share2,
  Download,
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { AIModelType } from '../types';
import { HKLogo } from './HKLogo';

export const Header: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    activeModel,
    setActiveModel,
    settings,
    updateSettings,
    setSettingsOpen,
    setImagineOpen,
    currentSession,
    createNewSession,
    activeCanvasArtifact,
    openCanvas,
    closeCanvas,
  } = useAI();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modelsList: {
    id: AIModelType;
    name: string;
    description: string;
    badge: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      id: 'samrat-turbo',
      name: 'HK Samrat Turbo 3.5',
      description: 'Ultra-fast neural generation with instant natural responses',
      badge: 'Speed Core',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      id: 'samrat-reasoner',
      name: 'HK Samrat Deep Reasoner',
      description: 'Systematic step-by-step logic chains and mathematical reasoning',
      badge: 'Logic Core',
      icon: BrainCircuit,
      color: 'text-purple-400',
    },
    {
      id: 'samrat-search',
      name: 'HK Samrat Web Intelligence',
      description: 'Live real-time web search grounding with verified citations',
      badge: 'Live Web',
      icon: Globe,
      color: 'text-cyan-400',
    },
    {
      id: 'samrat-architect',
      name: 'HK Samrat Code Architect',
      description: 'Interactive runnable apps, React, HTML, Canvas sandbox',
      badge: 'Full Stack',
      icon: Code2,
      color: 'text-emerald-400',
    },
    {
      id: 'samrat-imagine',
      name: 'HK Samrat Imagine Studio',
      description: 'Creative visual design and multimodal concept generator',
      badge: 'Visual AI',
      icon: ImageIcon,
      color: 'text-pink-400',
    },
  ];

  const currentModelObj = modelsList.find((m) => m.id === activeModel) || modelsList[0];

  const handleExportMarkdown = () => {
    if (!currentSession) return;
    let md = `# ${currentSession.title}\n*HK Samrat AI Export - ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of currentSession.messages) {
      md += `### ${msg.role === 'user' ? '👤 User' : '⚡ HK Samrat AI'}\n\n${msg.content}\n\n---\n\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.md`;
    a.click();
    setIsExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (!currentSession) return;
    const jsonStr = JSON.stringify(currentSession, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.json`;
    a.click();
    setIsExportMenuOpen(false);
  };

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#09090C]/90 backdrop-blur-xl px-3 md:px-5 flex items-center justify-between z-20 shrink-0 select-none font-sans">
      {/* Zone 1: Sidebar Toggle & Brand Lockup */}
      <div className="flex items-center gap-2.5">
        <button
          id="header-sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer"
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        {!isSidebarOpen && (
          <button
            id="header-new-chat-quick-btn"
            onClick={() => createNewSession()}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer hidden sm:flex items-center"
            title="New Chat (⌘K)"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        )}

        {/* Brand identity emblem & text */}
        <div className="flex items-center gap-2 pl-1 border-l border-white/[0.08]">
          <HKLogo size={26} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-xs md:text-sm">
              HK SAMRAT
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              3.5
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Model Architecture Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="header-model-selector-btn"
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131318] hover:bg-[#1A1A22] border border-white/[0.08] hover:border-white/[0.16] text-neutral-200 transition-all cursor-pointer shadow-xs"
        >
          <currentModelObj.icon className={`w-3.5 h-3.5 ${currentModelObj.color}`} />
          <span className="text-xs font-semibold tracking-tight max-w-[130px] sm:max-w-none truncate">
            {currentModelObj.name}
          </span>
          <span className="hidden lg:inline-block text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-neutral-400 font-mono">
            {currentModelObj.badge}
          </span>
          <ChevronDown className="w-3 h-3 text-neutral-500 ml-0.5" />
        </button>

        {/* Executive Model Menu Popover */}
        {isModelDropdownOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-84 md:w-96 rounded-2xl bg-[#111116] border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border-b border-white/[0.06] mb-1 flex items-center justify-between">
              <span>Proprietary Neural Engines</span>
              <span className="text-amber-400/90 font-bold">HK TECH WORLD</span>
            </div>
            <div className="space-y-1">
              {modelsList.map((m) => {
                const isSelected = activeModel === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    id={`model-select-${m.id}`}
                    onClick={() => {
                      setActiveModel(m.id);
                      if (m.id === 'samrat-imagine') {
                        setImagineOpen(true);
                      }
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1C24] text-white border border-white/[0.12] shadow-xs'
                        : 'hover:bg-[#16161D] text-neutral-400 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#0C0C10] border border-white/[0.06] mt-0.5 shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200">{m.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0C0C10] text-neutral-400 border border-white/[0.06] font-mono">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">{m.description}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Tools */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Search Grounding toggle */}
        <button
          id="header-toggle-search-btn"
          onClick={() =>
            updateSettings({ enableSearchGrounding: !settings.enableSearchGrounding })
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            settings.enableSearchGrounding || activeModel === 'samrat-search'
              ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300'
              : 'bg-[#131318] border border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:bg-[#1A1A22]'
          }`}
          title="Toggle Real-Time Web Intelligence Grounding"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Web</span>
        </button>

        {/* Deep Reasoning toggle */}
        <button
          id="header-toggle-reasoning-btn"
          onClick={() =>
            updateSettings({ enableThinkingProcess: !settings.enableThinkingProcess })
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            settings.enableThinkingProcess || activeModel === 'samrat-reasoner'
              ? 'bg-purple-950/40 border border-purple-500/40 text-purple-300'
              : 'bg-[#131318] border border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:bg-[#1A1A22]'
          }`}
          title="Toggle Deep Reasoning Thought Chains"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px]">Reason</span>
        </button>

        {/* Canvas Split View Toggle */}
        <button
          id="header-toggle-canvas-btn"
          onClick={() => {
            if (activeCanvasArtifact) {
              closeCanvas();
            } else {
              openCanvas({
                title: 'Live Interactive Canvas',
                type: 'html',
                code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #070709; color: #EDEDED; }\n    .card { background: #111116; padding: 2.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }\n    h2 { margin: 0 0 10px; color: #FFF; font-size: 22px; font-weight: 700; }\n    p { color: #888; font-size: 13px; line-height: 1.6; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>HK Samrat Live Canvas</h2>\n    <p>Ask HK Samrat AI to generate web apps, landing pages, interactive calculators, charts, games, or SVGs to render live in this sandbox.</p>\n  </div>\n</body>\n</html>',
              });
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeCanvasArtifact
              ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
              : 'bg-[#131318] border border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:bg-[#1A1A22]'
          }`}
          title="Toggle Live Code Sandbox Canvas"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline text-[11px]">Canvas</span>
        </button>

        {/* Export / Share Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            id="header-export-menu-btn"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-[#1A1A22] border border-white/[0.08] transition-colors cursor-pointer"
            title="Export Conversation"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111116] border border-white/[0.1] shadow-2xl p-1.5 z-50">
              <button
                id="export-markdown-btn"
                onClick={handleExportMarkdown}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-[#1C1C24] hover:text-white rounded-lg text-left cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Markdown</span>
              </button>
              <button
                id="export-json-btn"
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-[#1C1C24] hover:text-white rounded-lg text-left cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          id="header-settings-btn"
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-[#1A1A22] border border-white/[0.08] transition-colors cursor-pointer"
          title="Open Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
