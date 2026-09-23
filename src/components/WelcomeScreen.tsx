import React from 'react';
import {
  Zap,
  BrainCircuit,
  Globe,
  Code2,
  Image as ImageIcon,
  ArrowUpRight,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { AIModelType } from '../types';
import { HKLogo } from './HKLogo';

export const WelcomeScreen: React.FC = () => {
  const { sendMessage, setActiveModel, setImagineOpen, openCanvas } = useAI();

  const starterCards: {
    title: string;
    description: string;
    prompt: string;
    icon: React.ElementType;
    model: AIModelType;
    category: string;
  }[] = [
    {
      category: 'Strategic Reasoning',
      title: 'Business & Startup Strategy',
      description: 'Complete scalable execution roadmap in Hinglish or English',
      prompt: 'Bhai mujhe ek scalable tech startup ka complete business plan, architecture aur 90-day execution roadmap bana kar samjhao.',
      icon: Zap,
      model: 'samrat-turbo',
    },
    {
      category: 'Full-Stack Architecture',
      title: 'Interactive Web App Canvas',
      description: 'Generates runnable reactive frontend in real-time sandbox',
      prompt: 'Create a fully interactive, ultra-modern Crypto Portfolio & Analytics dashboard with live charts and dark mode inside the code canvas.',
      icon: Code2,
      model: 'samrat-architect',
    },
    {
      category: 'Live Grounding',
      title: 'Real-Time Web Intelligence',
      description: 'Latest breakthroughs & verified market facts from the live web',
      prompt: 'Search the live web for the latest breakthrough announcements and major tech releases this week with verified citations.',
      icon: Globe,
      model: 'samrat-search',
    },
    {
      category: 'Visual Synthesis',
      title: 'Imagine Art & Avatar Studio',
      description: 'Hyper-detailed 3D conceptual assets and cinematic art',
      prompt: 'Generate an ultra-realistic 8K cinematic concept of a futuristic cybernetic imperial warrior in neo-Tokyo with glowing golden katana.',
      icon: ImageIcon,
      model: 'samrat-imagine',
    },
  ];

  const quickPrompts = [
    { label: 'Explain Quantum Computing in Hindi', prompt: 'Quantum computing ko aasan Hindi me real-world examples ke saath samjhao.' },
    { label: 'Debug React / Node.js Code', prompt: 'I need you to act as a principal engineer and help me optimize and debug complex code.' },
    { label: 'Generate Complete Python Script', prompt: 'Write a high-performance Python script for automated web data scraping with error handling.' },
  ];

  const handleCardClick = (card: typeof starterCards[0]) => {
    if (card.model === 'samrat-imagine') {
      setImagineOpen(true);
    } else {
      setActiveModel(card.model);
      sendMessage(card.prompt);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center px-4 py-6 md:py-10 select-none">
      {/* Brand Hero Editorial */}
      <div className="mb-7 flex flex-col items-center relative">
        {/* Ambient Royal Gold Glow */}
        <div className="absolute -top-12 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Master HK Samrat Sovereign Emblem */}
        <div className="relative mb-4 transform transition-all duration-300 hover:scale-105 cursor-pointer">
          <HKLogo size={76} />
        </div>

        {/* Luxury Title & Wordmark */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
          HK Samrat AI
        </h1>

        <p className="text-xs md:text-sm text-neutral-400 max-w-lg leading-relaxed font-sans mb-3">
          Sovereign Multimodal Intelligence · High-speed neural reasoning, real-time web intelligence, creative studio & live canvas.
        </p>

        {/* Clean Unboxed Metadata Badge */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
          <span>Hariom Kushwaha</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>HK Tech World</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span className="text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            Engine v3.5 Pro
          </span>
        </div>
      </div>

      {/* Flagship Starter Launchpad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mb-5">
        {starterCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => handleCardClick(card)}
              className="group p-3.5 md:p-4 rounded-2xl bg-[#0F0F14]/90 border border-white/[0.08] hover:border-amber-400/35 hover:bg-[#15151C] transition-all duration-200 flex items-start gap-3.5 shadow-sm text-left cursor-pointer relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-amber-400/20 before:to-transparent hover:before:via-amber-400/40"
            >
              <div className="p-2.5 rounded-xl bg-[#181822] border border-white/[0.08] shrink-0 text-amber-300 group-hover:text-amber-200 group-hover:border-amber-400/40 group-hover:shadow-[0_0_12px_rgba(245,208,97,0.2)] transition-all">
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 group-hover:text-amber-400 transition-colors">
                    {card.category}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-neutral-200 group-hover:text-white truncate">
                  {card.title}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-sans leading-relaxed">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Launch Chips */}
      <div className="flex items-center justify-center flex-wrap gap-2 w-full max-w-2xl">
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(item.prompt)}
            className="px-3 py-1.5 rounded-xl bg-[#111116] border border-white/[0.06] hover:border-amber-400/30 hover:bg-[#181822] text-neutral-400 hover:text-neutral-200 text-xs transition-all cursor-pointer truncate max-w-xs"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
