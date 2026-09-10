import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  Cpu,
  UserCheck,
  Volume2,
  VolumeX,
  Database,
  Info,
  Check,
  Zap,
  BrainCircuit,
  Globe,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  Moon,
  Sun,
  Shield,
  Palette,
  Play,
  Music,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { AIModelType, AppSettings, VoicePersonaId } from '../types';
import { synthesizeNeuralSpeech } from '../services/api';
import {
  VOICE_PERSONAS,
  resolveBestVoice,
  chimeSynthesizer,
  VoicePersona,
} from '../utils/voiceEngine';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    sessions,
    clearAllSessions,
  } = useAI();

  const [activeTab, setActiveTab] = useState<
    'general' | 'intelligence' | 'instructions' | 'voice' | 'data' | 'about'
  >('general');

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [previewingPersonaId, setPreviewingPersonaId] = useState<VoicePersonaId | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load available speech voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isSettingsOpen) return null;

  const handlePreviewPersona = async (persona: VoicePersona) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (previewingPersonaId === persona.id) {
      setPreviewingPersonaId(null);
      return;
    }

    setPreviewingPersonaId(persona.id);
    const sampleText = persona.previewSampleText;

    // Try Neural AI speech first
    try {
      const res = await synthesizeNeuralSpeech(sampleText, persona.id, settings.voice.voiceName);
      if (res.audioData && !res.fallbackToBrowser) {
        const audio = new Audio(`data:${res.mimeType || 'audio/wav'};base64,${res.audioData}`);
        previewAudioRef.current = audio;
        audio.playbackRate = settings.voice.voiceRate || 1.0;
        audio.onended = () => {
          setPreviewingPersonaId(null);
          previewAudioRef.current = null;
        };
        audio.onerror = () => {
          previewAudioRef.current = null;
          fallbackBrowserSpeech(persona, sampleText);
        };
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    fallbackBrowserSpeech(persona, sampleText);
  };

  const fallbackBrowserSpeech = (persona: VoicePersona, sampleText: string) => {
    if (!window.speechSynthesis) {
      setPreviewingPersonaId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    const resolution = resolveBestVoice(persona.id, availableVoices, sampleText);
    if (resolution.voice) {
      utterance.voice = resolution.voice;
      utterance.lang = resolution.voice.lang || resolution.lang;
    } else {
      utterance.lang = resolution.lang;
    }

    utterance.rate = Math.max(0.75, Math.min(1.4, settings.voice.voiceRate || 1.0));
    utterance.pitch = Math.max(0.85, Math.min(1.15, settings.voice.voicePitch || 1.0));

    utterance.onend = () => setPreviewingPersonaId(null);
    utterance.onerror = () => setPreviewingPersonaId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSelectPersona = (persona: VoicePersona) => {
    updateSettings({
      voice: {
        ...settings.voice,
        persona: persona.id,
        language: persona.language,
        voiceName: '', // Auto-resolve by persona
      },
    });
    if (settings.soundEffects) {
      chimeSynthesizer.play('click');
    }
  };

  const handleExportAllData = () => {
    const data = {
      app: 'HK Samrat AI',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      sessions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hk_samrat_ai_backup_${Date.now()}.json`;
    a.click();
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const totalMessagesCount = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0E0E0E] border border-[#262626] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#E5E5E5]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] border border-[#333] flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-serif italic font-bold text-white tracking-wide">HK Samrat AI Configuration</h2>
              <p className="text-[11px] text-[#888]">Engine architectures, cognitive personas, voice and system behavior</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Tab navigation */}
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#262626] p-3 space-y-1 bg-[#101010] shrink-0 overflow-x-auto flex md:flex-col gap-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>General & Look</span>
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'intelligence'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Model Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('instructions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'instructions'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Custom Instructions</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'voice'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice & Audio</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'data'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Data & Backup</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all text-left whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-[#1C1C1C] text-white border border-[#444] shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#888]" />
              <span>About HK Samrat</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#0E0E0E]">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Appearance & Theme</h3>
                  <p className="text-xs text-[#888] mb-3">Choose the aesthetic style of HK Samrat AI</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'midnight', name: 'Editorial Dark', desc: 'Sleek high contrast' },
                      { id: 'dark', name: 'Deep Slate', desc: 'Balanced neutral' },
                      { id: 'cyber-emerald', name: 'Matrix Emerald', desc: 'Futuristic terminal' },
                      { id: 'light', name: 'Studio Light', desc: 'Paper high contrast' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          settings.theme === theme.id
                            ? 'bg-[#1C1C1C] border-[#555] text-white ring-1 ring-[#555]'
                            : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">{theme.name}</div>
                        <div className="text-[10px] text-[#666] mt-0.5">{theme.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262626]">
                  <h3 className="text-sm font-semibold text-white mb-1">Streaming Animation Speed</h3>
                  <p className="text-xs text-[#888] mb-3">How fast generated tokens appear on screen</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'hyper', name: 'Turbo Velocity', sub: 'Instant streaming speed' },
                      { id: 'smooth', name: 'Wave Stream', sub: 'Typing cadence' },
                      { id: 'instant', name: 'Direct Burst', sub: 'Maximum raw output' },
                    ].map((speed) => (
                      <button
                        key={speed.id}
                        onClick={() => updateSettings({ streamingSpeed: speed.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          settings.streamingSpeed === speed.id
                            ? 'bg-[#1C1C1C] border-[#555] text-white ring-1 ring-[#555]'
                            : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">{speed.name}</div>
                        <div className="text-[10px] text-[#666] mt-0.5">{speed.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262626] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Send Message with Enter</div>
                      <div className="text-[11px] text-[#777]">Shift + Enter creates a new line</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sendOnEnter}
                      onChange={(e) => updateSettings({ sendOnEnter: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#1A1A1A] border-[#333]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Sound Effects & Haptics</div>
                      <div className="text-[11px] text-[#777]">Audio feedback on completion</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEffects}
                      onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#1A1A1A] border-[#333]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* INTELLIGENCE TAB */}
            {activeTab === 'intelligence' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Default AI Architecture</h3>
                  <p className="text-xs text-[#888] mb-3">Select the default core engine for new conversations</p>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'samrat-turbo',
                        name: 'HK Samrat Turbo',
                        desc: 'Lightning-fast neural stream with instant natural answers',
                      },
                      {
                        id: 'samrat-reasoner',
                        name: 'HK Samrat Deep Reasoner',
                        desc: 'Advanced step-by-step analytical reasoning and logic chains',
                      },
                      {
                        id: 'samrat-search',
                        name: 'HK Samrat Web Intelligence',
                        desc: 'Real-time live web search grounding with verified citations',
                      },
                      {
                        id: 'samrat-architect',
                        name: 'HK Samrat Code Architect',
                        desc: 'Specialized in building runnable apps, React components & live Sandbox',
                      },
                    ].map((model) => (
                      <div
                        key={model.id}
                        onClick={() => updateSettings({ defaultModel: model.id as any })}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          settings.defaultModel === model.id
                            ? 'bg-[#1C1C1C] border-[#555] text-white'
                            : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{model.name}</div>
                          <div className="text-[11px] text-[#777]">{model.desc}</div>
                        </div>
                        {settings.defaultModel === model.id && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262626]">
                  <h3 className="text-sm font-semibold text-white mb-1">Reasoning Effort (Thinking Budget)</h3>
                  <p className="text-xs text-[#888] mb-3">Controls how intensely HK Samrat AI ponders and plans before answering</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'HIGH', label: 'High (Deep Logic)', desc: 'Full step-by-step reasoning' },
                      { id: 'LOW', label: 'Low (Balanced)', desc: 'Faster thinking' },
                      { id: 'MINIMAL', label: 'Minimal (Turbo)', desc: 'Zero latency' },
                    ].map((effort) => (
                      <button
                        key={effort.id}
                        onClick={() => updateSettings({ thinkingEffort: effort.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          settings.thinkingEffort === effort.id
                            ? 'bg-[#1C1C1C] border-[#555] text-purple-300 ring-1 ring-[#555]'
                            : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-purple-300">{effort.label}</div>
                        <div className="text-[10px] text-[#666] mt-0.5">{effort.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Creativity & Temperature ({settings.temperature})</span>
                    <span className="text-[11px] text-[#777] font-mono">
                      {settings.temperature < 0.4 ? 'Strict & Precise' : settings.temperature > 0.9 ? 'Creative' : 'Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            )}

            {/* CUSTOM INSTRUCTIONS & MEMORY TAB */}
            {activeTab === 'instructions' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Custom Instructions & Memory</h3>
                    <p className="text-xs text-[#888]">Teach HK Samrat AI how to understand you and tailor its persona</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.customInstructions.enabled}
                    onChange={(e) =>
                      updateSettings({
                        customInstructions: { ...settings.customInstructions, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#1A1A1A] border-[#333]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#AAA] mb-1.5 uppercase">
                      User Name / Handle
                    </label>
                    <input
                      type="text"
                      value={settings.customInstructions.userName}
                      onChange={(e) =>
                        updateSettings({
                          customInstructions: { ...settings.customInstructions, userName: e.target.value },
                        })
                      }
                      placeholder="e.g. Samrat"
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#555]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#AAA] mb-1.5 uppercase">
                      Preferred Language & Dialect
                    </label>
                    <select
                      value={settings.customInstructions.preferredLanguage}
                      onChange={(e) =>
                        updateSettings({
                          customInstructions: {
                            ...settings.customInstructions,
                            preferredLanguage: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#555]"
                    >
                      <option value="auto">Auto-detect language (Hindi, Hinglish, English)</option>
                      <option value="hindi">Hindi (हिंदी में उत्तर दें)</option>
                      <option value="hinglish">Hinglish (Hindi + English natural conversational)</option>
                      <option value="english">English (Professional & Clear)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#AAA] mb-1.5 uppercase">
                    What would you like HK Samrat AI to know about you?
                  </label>
                  <textarea
                    rows={3}
                    value={settings.customInstructions.userBio}
                    onChange={(e) =>
                      updateSettings({
                        customInstructions: { ...settings.customInstructions, userBio: e.target.value },
                      })
                    }
                    placeholder="Where are you based? What do you do? What tools or tech stacks do you use?"
                    className="w-full bg-[#141414] border border-[#262626] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#555] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#AAA] mb-1.5 uppercase">
                    How would you like HK Samrat AI to respond?
                  </label>
                  <textarea
                    rows={3}
                    value={settings.customInstructions.responsePreferences}
                    onChange={(e) =>
                      updateSettings({
                        customInstructions: {
                          ...settings.customInstructions,
                          responsePreferences: e.target.value,
                        },
                      })
                    }
                    placeholder="How formal or casual? Should it provide full runnable code or concise summaries?"
                    className="w-full bg-[#141414] border border-[#262626] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#555] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#AAA] mb-1.5 uppercase">
                    Response Tone Archetype
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'professional', label: 'Professional' },
                      { id: 'concise', label: 'Direct & Concise' },
                      { id: 'friendly', label: 'Friendly Guru' },
                      { id: 'technical', label: 'Tech Architect' },
                      { id: 'creative', label: 'Creative Writer' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() =>
                          updateSettings({
                            customInstructions: {
                              ...settings.customInstructions,
                              preferredTone: tone.id as any,
                            },
                          })
                        }
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          settings.customInstructions.preferredTone === tone.id
                            ? 'bg-[#1C1C1C] border-[#555] text-white'
                            : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VOICE & AUDIO TAB */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">Voice & Audio Experience</h3>
                    <span className="text-[10px] font-mono text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      NEURAL SYNTHESIS
                    </span>
                  </div>
                  <p className="text-xs text-[#888] mb-4">Select fine-tuned Indian Hindi, Indian English, and Global Studio voices</p>

                  {/* Voice Personas Grid */}
                  <div className="mb-6">
                    <label className="block text-xs font-mono text-[#AAA] mb-2 uppercase tracking-wide">
                      Select Voice Persona ({VOICE_PERSONAS.length} Available)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {VOICE_PERSONAS.map((persona) => {
                        const isSelected = (settings.voice.persona || 'aaradhya') === persona.id;
                        const isPreviewing = previewingPersonaId === persona.id;

                        return (
                          <div
                            key={persona.id}
                            onClick={() => handleSelectPersona(persona)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                              isSelected
                                ? 'bg-[#181818] border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm'
                                : 'bg-[#121212] border-[#262626] hover:border-[#3B3B3B]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-white">{persona.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#222] text-[#AAA] font-mono">
                                    {persona.tag}
                                  </span>
                                </div>
                                <div className="text-[11px] text-blue-400/90 font-sans mt-0.5">
                                  {persona.nativeName}
                                </div>
                                <div className="text-[11px] text-[#777] mt-1 line-clamp-2">
                                  {persona.description}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewPersona(persona);
                                }}
                                className={`shrink-0 p-2 rounded-lg border transition-all ${
                                  isPreviewing
                                    ? 'bg-blue-500 text-white border-blue-400 animate-pulse'
                                    : 'bg-[#1F1F1F] text-[#AAA] hover:text-white border-[#333] hover:bg-[#282828]'
                                }`}
                                title="Listen to Voice Preview"
                              >
                                {isPreviewing ? (
                                  <Volume2 className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                )}
                              </button>
                            </div>

                            {isSelected && (
                              <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between text-[10px] text-blue-400 font-mono">
                                <span>ACTIVE ENGINE</span>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-[#262626]">
                      <div>
                        <div className="text-xs font-medium text-white">Auto-Read Responses</div>
                        <div className="text-[10px] text-[#777]">Read answers aloud automatically</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.voice.autoSpeak}
                        onChange={(e) =>
                          updateSettings({
                            voice: { ...settings.voice, autoSpeak: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#1A1A1A] border-[#333]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-[#262626]">
                      <div>
                        <div className="text-xs font-medium text-white">Futuristic Sound Effects</div>
                        <div className="text-[10px] text-[#777]">Subtle audio cues on send & receive</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.soundEffects}
                        onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#1A1A1A] border-[#333]"
                      />
                    </div>
                  </div>

                  {/* Speed and Pitch Fine-Tuning */}
                  <div className="space-y-4 p-4 rounded-xl bg-[#121212] border border-[#262626]">
                    <div className="text-xs font-semibold text-white">Voice Fine-Tuning & Nuances</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#AAA] font-mono mb-1.5">
                          <span>SPEECH SPEED ({settings.voice.voiceRate}x)</span>
                          <span className="text-[10px] text-[#666]">
                            {settings.voice.voiceRate < 0.9 ? 'Slow' : settings.voice.voiceRate > 1.1 ? 'Fast' : 'Natural'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.4"
                          step="0.05"
                          value={settings.voice.voiceRate}
                          onChange={(e) =>
                            updateSettings({
                              voice: { ...settings.voice, voiceRate: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-[#AAA] font-mono mb-1.5">
                          <span>TONAL PITCH ({settings.voice.voicePitch}x)</span>
                          <span className="text-[10px] text-[#666]">
                            {settings.voice.voicePitch < 0.95 ? 'Deeper' : settings.voice.voicePitch > 1.05 ? 'Higher' : 'Balanced'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.3"
                          step="0.05"
                          value={settings.voice.voicePitch}
                          onChange={(e) =>
                            updateSettings({
                              voice: { ...settings.voice, voicePitch: parseFloat(e.target.value) },
                            })
                          }
                          className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                    </div>

                    {/* Advanced Voice Override */}
                    <div className="pt-3 border-t border-[#222]">
                      <label className="block text-[11px] font-mono text-[#888] mb-1.5">
                        ADVANCED: BROWSER SYSTEM VOICE OVERRIDE ({availableVoices.length} DETECTED)
                      </label>
                      <select
                        value={settings.voice.voiceName}
                        onChange={(e) =>
                          updateSettings({
                            voice: { ...settings.voice, voiceName: e.target.value },
                          })
                        }
                        className="w-full bg-[#181818] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#555]"
                      >
                        <option value="">Auto Selected by Persona (Recommended)</option>
                        {availableVoices.map((v, index) => (
                          <option key={`${v.name}-${v.lang}-${v.voiceURI || index}`} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DATA & STORAGE TAB */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Data Storage & Local Backup</h3>
                  <p className="text-xs text-[#888] mb-4">Export conversations, manage cache and analytics</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626]">
                      <div className="text-xl font-bold font-serif text-white">{sessions.length}</div>
                      <div className="text-[10px] text-[#777] font-mono uppercase mt-0.5">Conversations</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626]">
                      <div className="text-xl font-bold font-serif text-blue-400">{totalMessagesCount}</div>
                      <div className="text-[10px] text-[#777] font-mono uppercase mt-0.5">Messages</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626]">
                      <div className="text-xl font-bold font-serif text-emerald-400">100%</div>
                      <div className="text-[10px] text-[#777] font-mono uppercase mt-0.5">Local Storage</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleExportAllData}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-white transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-xs font-semibold">Export All Chats & Settings (JSON)</div>
                          <div className="text-[10px] text-[#777]">Download complete backup file</div>
                        </div>
                      </div>
                      {copiedSuccess ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-xs font-mono text-blue-400">DOWNLOAD</span>
                      )}
                    </button>

                    <div className="p-3.5 rounded-xl bg-[#181111] border border-[#3A1E1E] space-y-3">
                      <div className="flex items-center gap-3 text-red-300">
                        <Trash2 className="w-4 h-4 shrink-0 text-red-400" />
                        <div>
                          <div className="text-xs font-semibold">Clear All Chat History</div>
                          <div className="text-[10px] text-red-400/80">
                            Permanently removes all conversations from browser storage
                          </div>
                        </div>
                      </div>
                      {showClearConfirm ? (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              clearAllSessions();
                              setShowClearConfirm(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-mono font-bold"
                          >
                            CONFIRM DELETE
                          </button>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-[#AAA] text-xs font-mono"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowClearConfirm(true)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-mono border border-red-800/40"
                        >
                          Clear History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#141414] border border-[#262626]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#333] flex items-center justify-center text-white font-serif italic font-bold text-lg">
                      HK
                    </div>
                    <div>
                      <h4 className="text-sm font-serif italic font-bold text-white">HK Samrat AI (Version 3.0 Pro)</h4>
                      <p className="text-[11px] text-blue-400 font-mono">Next-Generation Unified Neural Intelligence</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed mt-2 font-sans">
                    HK Samrat AI is built by <span className="text-white font-semibold">HK Tech World</span>. Custom-engineered to deliver ultra-fast streaming speed, deep analytical reasoning, live real-time web grounding, and an interactive multimodal code canvas.
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#222] flex flex-col gap-1.5">
                    <p className="text-xs text-[#AAA]">
                      Created with ❤️ in India 🇮🇳 by <span className="text-white font-semibold">Hariom Kushwaha</span> (HK Tech World)
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-mono text-blue-400/90">HK Tech World &bull; Version 3.0 Pro</span>
                      <a
                        href="/privacy.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline font-mono text-xs"
                      >
                        Privacy Policy &amp; Terms &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#262626]">
                    <div className="font-semibold text-white">HK Turbo Velocity</div>
                    <div className="text-[11px] text-[#777] mt-0.5 font-sans">Ultra-fast stream processing with instant natural comprehension</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#262626]">
                    <div className="font-semibold text-white">HK Deep Reasoning</div>
                    <div className="text-[11px] text-[#777] mt-0.5 font-sans">Step-by-step thinking & advanced problem solving logic</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#262626]">
                    <div className="font-semibold text-white">HK Web Intelligence</div>
                    <div className="text-[11px] text-[#777] mt-0.5 font-sans">Real-time live web search links & verified sources</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#262626]">
                    <div className="font-semibold text-white">HK Code Canvas</div>
                    <div className="text-[11px] text-[#777] mt-0.5 font-sans">Interactive sandbox for live HTML, React, SVGs & Python</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#141414] flex justify-end">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2 rounded-lg bg-white hover:bg-[#E5E5E5] text-black text-xs font-mono font-bold transition-all shadow-xs"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};
