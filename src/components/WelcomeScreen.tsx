import React from 'react';
import {
  Zap,
  BrainCircuit,
  Globe,
  Code2,
  Image as ImageIcon,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { AIModelType } from '../types';
import { AdSenseBanner } from './AdSenseBanner';

export const WelcomeScreen: React.FC = () => {
  const { sendMessage, setActiveModel, setImagineOpen } = useAI();

  const starterCards: {
    category: string;
    title: string;
    prompt: string;
    icon: React.ElementType;
    model: AIModelType;
    iconColor: string;
    iconBg: string;
  }[] = [
    {
      category: 'Instant Chat',
      title: 'Hinglish / Hindi Assistant',
      prompt: 'Bhai mujhe ek successful tech startup ka complete roadmap aur business plan bana kar samjha do.',
      icon: Zap,
      model: 'samrat-turbo',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      category: 'Code & Logic',
      title: 'Interactive Web App',
      prompt: 'Create a fully interactive modern Pomodoro & Task Tracker app with dark mode in live canvas.',
      icon: Code2,
      model: 'samrat-architect',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      category: 'Web Grounding',
      title: 'Live Real-time Search',
      prompt: 'Search the live web and tell me the latest major AI breakthroughs and tech news today with links.',
      icon: Globe,
      model: 'samrat-search',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      category: 'Visual AI',
      title: 'Imagine Art Studio',
      prompt: 'Generate a stunning 3D cyberpunk avatar of a samurai in neon Tokyo night with glowing katana.',
      icon: ImageIcon,
      model: 'samrat-imagine',
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20',
    },
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
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center px-4 py-6 md:py-10 select-none">
      {/* Brand Hero Editorial */}
      <div className="mb-6 md:mb-8 flex flex-col items-center">
        <div className="mb-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-center shadow-lg">
            <span className="font-serif italic font-bold text-xl md:text-2xl text-white tracking-wide">HK</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-4xl font-serif italic font-bold tracking-tight text-white mb-2">
          HK Samrat AI
        </h1>
        <p className="text-xs md:text-sm text-[#888] max-w-md leading-relaxed">
          How can I help you today? Ask in Hindi, Hinglish, or English.
        </p>
      </div>

      {/* Clean Starter Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {starterCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => handleCardClick(card)}
              className="group p-3.5 rounded-xl bg-[#121212] border border-[#222] hover:border-[#383838] hover:bg-[#171717] transition-all flex items-start gap-3 shadow-xs text-left cursor-pointer"
            >
              <div className={`p-2 rounded-lg border ${card.iconBg} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-semibold text-[#EEE] group-hover:text-white truncate">
                    {card.title}
                  </h4>
                  <ArrowUpRight className="w-3 h-3 text-[#555] group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-[#777] line-clamp-1 group-hover:text-[#999] transition-colors font-sans">
                  {card.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Google AdSense Placement */}
      <AdSenseBanner className="mt-5 w-full" />
    </div>
  );
};

