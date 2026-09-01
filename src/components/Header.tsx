import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Zap,
  BrainCircuit,
  Globe,
  Code2,
  Image as ImageIcon,
  Sparkles,
  Share2,
  Download,
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  Layout,
  Layers,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { AIModelType } from '../types';

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
      name: 'HK Samrat Turbo',
      description: 'Lightning-fast neural stream with instant natural answers',
      badge: 'Super Fast',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      id: 'samrat-reasoner',
      name: 'HK Samrat Deep Reasoner',
      description: 'Advanced step-by-step analytical reasoning and logic chains',
      badge: 'Complex Logic',
      icon: BrainCircuit,
      color: 'text-purple-400',
    },
    {
      id: 'samrat-search',
      name: 'HK Samrat Web Intelligence',
      description: 'Live real-time web search grounding with verified citations',
      badge: 'Real-time Web',
      icon: Globe,
      color: 'text-cyan-400',
    },
    {
      id: 'samrat-architect',
      name: 'HK Samrat Code Architect',
      description: 'Interactive runnable apps, React, HTML, Canvas sandbox',
      badge: 'Coding Pro',
      icon: Code2,
      color: 'text-emerald-400',
    },
    {
      id: 'samrat-imagine',
      name: 'HK Samrat Imagine Studio',
      description: 'Creative multimodal visual design and illustration generator',
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
    <header className="h-14 border-b border-[#262626] bg-[#0A0A0A] px-4 md:px-6 flex items-center justify-between z-10 shrink-0 select-none font-sans">
      {/* Left section: Sidebar toggle & Model Picker */}
      <div className="flex items-center gap-2 md:gap-3">
        {!isSidebarOpen && (
          <button
            id="header-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] border border-[#262626] transition-colors"
            title="Open Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Model Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="header-model-selector-btn"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333] text-[#F5F5F5] transition-all"
          >
            <currentModelObj.icon className={`w-3.5 h-3.5 ${currentModelObj.color}`} />
            <span className="text-xs md:text-sm font-semibold tracking-tight">{currentModelObj.name}</span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A1A] text-blue-400 font-mono font-medium border border-[#333]">
              {currentModelObj.badge}
            </span>
            <ChevronDown className="w-3 h-3 text-[#666] ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 md:w-96 rounded-xl bg-[#0E0E0E] border border-[#262626] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-[10px] font-bold text-[#666] uppercase tracking-widest border-b border-[#262626] mb-1">
                Select Engine & Architecture
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
                      className={`w-full flex items-start gap-3 p-2.5 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white border border-[#333]'
                          : 'hover:bg-[#141414] text-[#AAA]'
                      }`}
                    >
                      <div className="p-2 rounded-md bg-[#111] border border-[#262626] mt-0.5 shrink-0">
                        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] text-[#777] border border-[#262626] font-mono">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777] leading-snug mt-0.5">{m.description}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Feature toggles & Actions */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Search Grounding toggle */}
        <button
          id="header-toggle-search-btn"
          onClick={() =>
            updateSettings({ enableSearchGrounding: !settings.enableSearchGrounding })
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            settings.enableSearchGrounding || activeModel === 'samrat-search'
              ? 'bg-[#1A1A1A] border border-blue-500/50 text-blue-400'
              : 'bg-[#141414] border border-[#262626] text-[#888] hover:text-white hover:bg-[#1A1A1A]'
          }`}
          title="Toggle Google Real-Time Search Grounding"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">Web Search</span>
        </button>

        {/* Deep Reasoning toggle */}
        <button
          id="header-toggle-reasoning-btn"
          onClick={() =>
            updateSettings({ enableThinkingProcess: !settings.enableThinkingProcess })
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            settings.enableThinkingProcess || activeModel === 'samrat-reasoner'
              ? 'bg-[#1A1A1A] border border-purple-500/50 text-purple-400'
              : 'bg-[#141414] border border-[#262626] text-[#888] hover:text-white hover:bg-[#1A1A1A]'
          }`}
          title="Toggle Deep Reasoning Thought Process"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px]">Deep Reason</span>
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
                code: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0A0A0A; color: #F5F5F5; }\n    .card { background: #111; padding: 2.5rem; border-radius: 16px; border: 1px solid #262626; max-width: 440px; text-align: center; }\n    h2 { margin: 0 0 10px; color: #FFF; font-family: serif; font-style: italic; font-size: 22px; }\n    p { color: #888; font-size: 13px; line-height: 1.6; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>HK Samrat Live Canvas</h2>\n    <p>Ask HK Samrat AI to generate web apps, landing pages, interactive calculators, charts, games, or SVGs to render live in this sandbox.</p>\n  </div>\n</body>\n</html>',
              });
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeCanvasArtifact
              ? 'bg-[#1A1A1A] border border-blue-500/50 text-blue-300'
              : 'bg-[#141414] border border-[#262626] text-[#888] hover:text-white hover:bg-[#1A1A1A]'
          }`}
          title="Toggle Live Code & HTML Sandbox Canvas"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline text-[11px]">Canvas</span>
        </button>

        {/* Export / Share Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            id="header-export-menu-btn"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] border border-[#262626] transition-colors"
            title="Export Conversation"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#0E0E0E] border border-[#262626] shadow-xl p-1.5 z-50">
              <button
                id="export-markdown-btn"
                onClick={handleExportMarkdown}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#DDD] hover:bg-[#1A1A1A] hover:text-white rounded-lg text-left"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Markdown</span>
              </button>
              <button
                id="export-json-btn"
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#DDD] hover:bg-[#1A1A1A] hover:text-white rounded-lg text-left"
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
          className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] border border-[#262626] transition-colors"
          title="Open Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
