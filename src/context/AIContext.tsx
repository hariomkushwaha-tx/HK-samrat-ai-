import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  AIModelType,
  AppSettings,
  ChatMessage,
  ChatSession,
  CustomInstructions,
  GroundingSource,
  MessageAttachment,
} from '../types';
import { streamChat, synthesizeNeuralSpeech } from '../services/api';
import {
  chunkTextForSpeech,
  resolveBestVoice,
  chimeSynthesizer,
  VOICE_PERSONAS,
} from '../utils/voiceEngine';

const DEFAULT_INSTRUCTIONS: CustomInstructions = {
  enabled: true,
  userBio: 'I am a passionate builder, student, and creator looking for fast, top-tier AI assistance.',
  responsePreferences: 'Provide clear, actionable, deep yet concise responses with code examples when needed.',
  userName: 'HK Developer',
  preferredLanguage: 'auto',
  preferredTone: 'professional',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'midnight',
  defaultModel: 'samrat-turbo',
  enableSearchGrounding: false,
  enableThinkingProcess: false,
  thinkingEffort: 'LOW',
  temperature: 0.7,
  streamingSpeed: 'hyper',
  customInstructions: DEFAULT_INSTRUCTIONS,
  voice: {
    autoSpeak: false,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceName: '',
    persona: 'aaradhya',
    language: 'hi-IN',
    smartLanguageDetection: true,
  },
  fontSize: 'md',
  soundEffects: true,
  sendOnEnter: true,
};

interface AIContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  settings: AppSettings;
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isImagineOpen: boolean;
  isGenerating: boolean;
  activeCanvasArtifact: {
    title: string;
    code: string;
    type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python';
  } | null;
  isSpeaking: boolean;
  isSpeechPaused: boolean;
  speakingMessageId: string | null;
  isSpeechLoading: boolean;
  speechLoadingMessageId: string | null;
  createNewSession: (initialModel?: AIModelType) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  pinSession: (id: string) => void;
  clearAllSessions: () => void;
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  stopGenerating: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setImagineOpen: (open: boolean) => void;
  openCanvas: (artifact: { title: string; code: string; type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python' }) => void;
  closeCanvas: () => void;
  speakText: (messageId: string, text: string, restart?: boolean) => void;
  pauseSpeech: () => void;
  resumeSpeech: (messageId?: string, text?: string) => void;
  stopSpeech: () => void;
  activeModel: AIModelType;
  setActiveModel: (model: AIModelType) => void;
}

const AIContext = createContext<AIContextType | null>(null);

const STORAGE_KEY_SESSIONS = 'hk_samrat_ai_sessions_v1';
const STORAGE_KEY_SETTINGS = 'hk_samrat_ai_settings_v1';

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load stored sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fall through to initial
    }
    const initialSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: DEFAULT_SETTINGS.defaultModel,
    };
    return [initialSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id || '');
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isSettingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isImagineOpen, setImagineOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeCanvasArtifact, setActiveCanvasArtifact] = useState<{
    title: string;
    code: string;
    type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python';
  } | null>(null);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState<boolean>(false);
  const [speechLoadingMessageId, setSpeechLoadingMessageId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<AIModelType>(settings.defaultModel);

  const abortControllerRef = useRef<(() => void) | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speechIndexRef = useRef<number>(0);
  const isSpeechActiveRef = useRef<boolean>(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const pausedChunkIndexRef = useRef<number>(0);
  const savedMessageIdRef = useRef<string | null>(null);
  const savedTextRef = useRef<string>('');
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Fine-grained character & word boundary tracking for seamless Resume without repeating
  const currentChunkTextRef = useRef<string>('');
  const currentWordCharOffsetRef = useRef<number>(0);
  const currentWordLengthRef = useRef<number>(0);
  const lastSpokenWordRef = useRef<string>('');

  // Auto-collapse sidebar on mobile screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Could not save sessions to localStorage', e);
    }
  }, [sessions]);

  // Sync settings to localStorage & apply theme class
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }

    // Apply theme class to document body
    document.documentElement.classList.remove('theme-dark', 'theme-midnight', 'theme-cyber', 'theme-light');
    if (settings.theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (settings.theme === 'cyber-emerald') {
      document.documentElement.classList.add('theme-cyber');
    } else if (settings.theme === 'midnight') {
      document.documentElement.classList.add('theme-midnight');
    } else {
      document.documentElement.classList.add('theme-dark');
    }
  }, [settings]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0] || null;

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      customInstructions: {
        ...prev.customInstructions,
        ...(newSettings.customInstructions || {}),
      },
      voice: {
        ...prev.voice,
        ...(newSettings.voice || {}),
      },
    }));
  };

  const createNewSession = (initialModel?: AIModelType): string => {
    const newId = 'session_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: initialModel || activeModel || settings.defaultModel,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveCanvasArtifact(null);
    return newId;
  };

  const selectSession = (id: string) => {
    setCurrentSessionId(id);
    const target = sessions.find((s) => s.id === id);
    if (target) {
      setActiveModel(target.model || settings.defaultModel);
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: 'session_' + Date.now(),
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          model: settings.defaultModel,
        };
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() || 'Untitled Chat', updatedAt: Date.now() } : s))
    );
  };

  const pinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned, updatedAt: Date.now() } : s))
    );
  };

  const clearAllSessions = () => {
    const fresh: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.defaultModel,
    };
    setSessions([fresh]);
    setCurrentSessionId(fresh.id);
    setActiveCanvasArtifact(null);
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Helper to extract code blocks from markdown for canvas
  const detectCodeArtifact = (content: string) => {
    const codeBlockMatch = content.match(/```(html|jsx|tsx|react|javascript|js|svg|xml|python|css)\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1].toLowerCase();
      let type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python' = 'html';
      if (lang === 'html') type = 'html';
      else if (['jsx', 'tsx', 'react'].includes(lang)) type = 'react';
      else if (['svg', 'xml'].includes(lang)) type = 'svg';
      else if (['javascript', 'js'].includes(lang)) type = 'javascript';
      else if (lang === 'python') type = 'python';

      return {
        type,
        title: `${type.toUpperCase()} Code Artifact`,
        code: codeBlockMatch[2],
      };
    }
    return undefined;
  };

  const sendMessage = async (content: string, attachments: MessageAttachment[] = []) => {
    const trimmed = content.trim();
    const cleanCmd = trimmed.toLowerCase().replace(/[.,!?:;|।\-_]/g, ' ').replace(/\s+/g, ' ').trim();

    // Voice & Text Playback Control Command Matchers
    const isStopCommand = (() => {
      if (!cleanCmd) return false;
      const patterns = [
        /^stop(\s|$)/, /^pause(\s|$)/, /^halt(\s|$)/, /^wait(\s|$)/,
        /^(रुको|रुक\s*जाओ|रुकिए|ठहरो|ठहर\s*जाओ|ठहरिए|चुप|चुप\s*रहो|चुप\s*हो\s*जाओ|रोको|रोक\s*दो|रोक\s*लो|पॉज)(\s|$)/,
        /बोलना\s*(बंद|रोको)/, /आवाज\s*(बंद|रोको)/,
        /stop\s*(speech|audio|karo|please)/, /pause\s*(speech|audio|karo|please)/,
      ];
      return patterns.some((p) => p.test(cleanCmd)) || ['stop', 'pause', 'रुको', 'ठहरो', 'चुप', 'रोको'].includes(cleanCmd);
    })();

    const isResumeCommand = (() => {
      if (!cleanCmd) return false;
      const patterns = [
        /^resume(\s|$)/, /^continue(\s|$)/, /^proceed(\s|$)/,
        /आगे\s*(बोलो|बताओ|सुनाओ|पढ़ो|पढ़ो|चलो|जारी|चालू)/,
        /जहाँ\s*से\s*रोका\s*था/,
        /वहीं\s*से\s*(चालू|बोलो|शुरू)/, /वही\s*से\s*(चालू|बोलो|शुरू)/,
        /^(चालू\s*करो|फिर\s*से\s*बोलो|बोलते\s*रहो|जारी\s*रखो|जारी\s*करो)(\s|$)/,
        /resume\s*(speech|audio|karo|please)/, /continue\s*(speech|audio|karo|please)/,
      ];
      return patterns.some((p) => p.test(cleanCmd)) || ['resume', 'continue', 'आगे बोलो', 'चालू करो'].includes(cleanCmd);
    })();

    const isSpeakCommand = (() => {
      if (!cleanCmd) return false;
      const patterns = [
        /^speak(\s|$)/, /^start(\s|$)/, /^read(\s|$)/,
        /बोलना\s*(शुरू|चालू)/, /पढ़ना\s*(शुरू|चालू)/,
        /^(बोलो|सुनाओ|पढ़ो|पढ़ो|शुरू\s*करो)(\s|$)/,
        /बोलकर\s*सुनाओ/, /बोल\s*के\s*बताओ/, /आवाज\s*में\s*सुनाओ/,
        /speak\s*(please|karo|out)/, /start\s*speaking/,
      ];
      return patterns.some((p) => p.test(cleanCmd)) || ['speak', 'start', 'बोलो', 'सुनाओ', 'पढ़ो'].includes(cleanCmd);
    })();

    // Allow STOP command even while generation is underway
    if ((!trimmed && attachments.length === 0) || (isGenerating && !isStopCommand)) return;

    let targetSessionId = currentSessionId;
    let currentSess = sessions.find((s) => s.id === targetSessionId);

    if (!currentSess) {
      targetSessionId = createNewSession();
      currentSess = sessions.find((s) => s.id === targetSessionId)!;
    }

    // Handle STOP / PAUSE command
    if (isStopCommand) {
      if (isGenerating) {
        stopGenerating();
      }
      pauseSpeech();

      const userMessageId = 'msg_user_' + Date.now();
      const assistantMessageId = 'msg_asst_' + (Date.now() + 1);
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
      };
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '⏸️ **बोलना रोक दिया गया है।** आपकी वर्तमान स्थिति (शब्द एवं वाक्य) सुरक्षित है।\n\nजब भी आप तैयार हों, **"आगे बोलो"** कहें या **Resume** बटन दबाएं — मैं ठीक उसी शब्द से आगे बोलना शुरू करूँगा।',
        timestamp: Date.now() + 1,
        modelUsed: activeModel,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMessage, assistantMessage] }
            : s
        )
      );
      return;
    }

    // Handle RESUME / CONTINUE command
    if (isResumeCommand) {
      resumeSpeech();
      const userMessageId = 'msg_user_' + Date.now();
      const assistantMessageId = 'msg_asst_' + (Date.now() + 1);
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
      };
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '▶️ **जारी किया जा रहा है...** जहाँ से रोका गया था, ठीक वहीं से बिना किसी दोहराव के बोलना शुरू कर रहा हूँ।',
        timestamp: Date.now() + 1,
        modelUsed: activeModel,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMessage, assistantMessage] }
            : s
        )
      );
      return;
    }

    // Handle START / SPEAK command
    if (isSpeakCommand && !isSpeaking) {
      const lastAsst = [...currentSess.messages].reverse().find((m) => m.role === 'assistant' && m.content);
      if (lastAsst) {
        speakText(lastAsst.id, lastAsst.content, true);
        const userMessageId = 'msg_user_' + Date.now();
        const assistantMessageId = 'msg_asst_' + (Date.now() + 1);
        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
          attachments,
        };
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '🔊 **शुरू से बोल रहा हूँ...**',
          timestamp: Date.now() + 1,
          modelUsed: activeModel,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMessage, assistantMessage] }
              : s
          )
        );
        return;
      }
    }

    const userMessageId = 'msg_user_' + Date.now();
    const assistantMessageId = 'msg_asst_' + (Date.now() + 1);

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      modelUsed: activeModel,
      isStreaming: true,
      isThinkingOpen: true,
    };

    const isFirstMessage = currentSess.messages.length === 0;
    const autoTitle = isFirstMessage
      ? content.slice(0, 36).trim() + (content.length > 36 ? '...' : '')
      : currentSess.title;

    // Append user message and blank assistant message
    const updatedMessages = [...currentSess.messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: autoTitle,
              updatedAt: Date.now(),
              messages: [...updatedMessages, initialAssistantMessage],
            }
          : s
      )
    );

    setIsGenerating(true);
    const startTime = Date.now();

    if (settings.soundEffects) {
      chimeSynthesizer.play('send');
    }

    const cancelStream = await streamChat({
      messages: updatedMessages,
      model: activeModel,
      enableSearchGrounding: settings.enableSearchGrounding || activeModel === 'samrat-search',
      enableThinkingProcess: settings.enableThinkingProcess || activeModel === 'samrat-reasoner',
      thinkingEffort: settings.thinkingEffort,
      temperature: settings.temperature,
      customInstructions: settings.customInstructions,
      onStart: () => {
        // Stream begun
      },
      onChunk: (chunk: string) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            const msgs = s.messages.map((m) => {
              if (m.id === assistantMessageId) {
                const newContent = m.content + chunk;
                return {
                  ...m,
                  content: newContent,
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );
      },
      onDone: (fullText: string, sources: GroundingSource[]) => {
        const duration = Date.now() - startTime;
        const artifact = detectCodeArtifact(fullText);

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            const msgs = s.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: fullText,
                  isStreaming: false,
                  groundingSources: sources,
                  thinkingDurationMs: duration,
                  codeArtifact: artifact,
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );

        setIsGenerating(false);

        if (settings.soundEffects) {
          chimeSynthesizer.play('receive');
        }

        // Auto speak if enabled
        if (settings.voice.autoSpeak && fullText) {
          speakText(assistantMessageId, fullText);
        }
      },
      onError: (errMsg: string) => {
        let displayError = errMsg;
        if (
          !displayError ||
          displayError.includes('API_KEY') ||
          displayError.includes('GEMINI') ||
          displayError.includes('gemini') ||
          displayError.includes('apiKey') ||
          displayError.includes('Google') ||
          displayError.includes('google') ||
          displayError.includes('openai') ||
          displayError.includes('OpenAI') ||
          displayError.includes('groq') ||
          displayError.includes('GROQ') ||
          displayError.includes('Vercel') ||
          displayError.includes('500') ||
          displayError.includes('Internal Server Error')
        ) {
          displayError = 'HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया कुछ पलों बाद "Retry Message" पर क्लिक करें।';
        } else if (
          displayError.includes('503') ||
          displayError.includes('UNAVAILABLE') ||
          displayError.includes('high demand')
        ) {
          displayError = 'HK Samrat AI सर्वर पर अभी भारी ट्रैफिक है। कृपया कुछ पलों बाद दोबारा प्रयास करें।';
        }

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== targetSessionId) return s;
            const msgs = s.messages.map((m) => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: m.content || `⚠️ ${displayError}`,
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );
        setIsGenerating(false);
      },
    });

    abortControllerRef.current = cancelStream;
  };

  const regenerateMessage = async (messageId: string) => {
    if (!currentSession || isGenerating) return;
    const msgIndex = currentSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Find the previous user message
    const historyUpToUser = currentSession.messages.slice(0, msgIndex);
    const lastUserMsg = currentSession.messages[msgIndex - 1];

    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    // Truncate to user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              messages: historyUpToUser,
            }
          : s
      )
    );

    // Resend
    await sendMessage(lastUserMsg.content, lastUserMsg.attachments);
  };

  const openCanvas = (artifact: {
    title: string;
    code: string;
    type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python';
  }) => {
    setActiveCanvasArtifact(artifact);
  };

  const closeCanvas = () => {
    setActiveCanvasArtifact(null);
  };

  const playSpeechChunk = (messageId: string, chunks: string[], index: number) => {
    if (!window.speechSynthesis || !isSpeechActiveRef.current || index >= chunks.length) {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setSpeakingMessageId(null);
      isSpeechActiveRef.current = false;
      return;
    }

    speechIndexRef.current = index;
    const currentChunk = chunks[index];
    currentChunkTextRef.current = currentChunk;
    currentWordCharOffsetRef.current = 0;
    currentWordLengthRef.current = 0;

    const utterance = new SpeechSynthesisUtterance(currentChunk);

    const availableVoices = window.speechSynthesis.getVoices();
    const resolution = resolveBestVoice(settings.voice.persona || 'aaradhya', availableVoices, currentChunk);

    if (settings.voice.voiceName) {
      const explicit = availableVoices.find((v) => v.name === settings.voice.voiceName);
      if (explicit) {
        utterance.voice = explicit;
        utterance.lang = explicit.lang || resolution.lang;
      } else if (resolution.voice) {
        utterance.voice = resolution.voice;
        utterance.lang = resolution.lang;
      } else {
        utterance.lang = resolution.lang;
      }
    } else if (resolution.voice) {
      utterance.voice = resolution.voice;
      utterance.lang = resolution.lang;
    } else {
      utterance.lang = resolution.lang;
    }

    // Natural Rate & Pitch (clamped to realistic vocal cord frequencies)
    utterance.rate = Math.max(0.75, Math.min(1.4, settings.voice.voiceRate || 1.0));
    utterance.pitch = Math.max(0.85, Math.min(1.15, settings.voice.voicePitch || 1.0));

    // Word boundary tracking for exact resume
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word' || !e.name) {
        currentWordCharOffsetRef.current = e.charIndex;
        const remaining = currentChunk.slice(e.charIndex);
        const match = remaining.match(/^\S+/);
        if (match) {
          currentWordLengthRef.current = match[0].length;
          lastSpokenWordRef.current = match[0];
        }
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      if (isSpeechActiveRef.current) {
        // Natural human breath pause between sentences (50ms)
        setTimeout(() => {
          if (isSpeechActiveRef.current) {
            playSpeechChunk(messageId, chunks, index + 1);
          }
        }, 50);
      }
    };

    utterance.onerror = (e: any) => {
      // If user paused or stopped, cancel was called deliberately, do not auto-advance!
      if (!isSpeechActiveRef.current || e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      console.warn('Speech chunk error, proceeding:', e);
      if (isSpeechActiveRef.current && index + 1 < chunks.length) {
        setTimeout(() => {
          if (isSpeechActiveRef.current) {
            playSpeechChunk(messageId, chunks, index + 1);
          }
        }, 50);
      } else {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        isSpeechActiveRef.current = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (messageId: string, text: string, restart = false) => {
    if (!restart) {
      // Toggle pause/resume if interacting with the current message
      if (isSpeaking && speakingMessageId === messageId) {
        pauseSpeech();
        return;
      }
      if (isSpeechPaused && speakingMessageId === messageId) {
        resumeSpeech(messageId, text);
        return;
      }
    }

    stopSpeech();
    savedMessageIdRef.current = messageId;
    savedTextRef.current = text;
    pausedTimeRef.current = 0;
    pausedChunkIndexRef.current = 0;

    // Check if audio was already cached in memory for instant replay
    const cachedAudio = audioCacheRef.current.get(messageId);
    if (cachedAudio && !restart) {
      activeAudioRef.current = cachedAudio;
      cachedAudio.currentTime = 0;
      isSpeechActiveRef.current = true;
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setSpeakingMessageId(messageId);
      try {
        await cachedAudio.play();
        return;
      } catch {
        // Fallback to re-synthesis
      }
    }

    const chunks = chunkTextForSpeech(text);
    if (!chunks || chunks.length === 0) return;

    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;
    isSpeechActiveRef.current = true;
    setIsSpeechLoading(true);
    setSpeechLoadingMessageId(messageId);
    setSpeakingMessageId(messageId);
    setIsSpeechPaused(false);

    // Synchronously create an Audio instance during user gesture
    const preppedAudio = new Audio();
    activeAudioRef.current = preppedAudio;

    if (settings.soundEffects) {
      chimeSynthesizer.play('voice_start');
    }

    // Try high-definition server-side Neural AI voice first
    try {
      const res = await synthesizeNeuralSpeech(
        text,
        settings.voice.persona || 'aaradhya',
        settings.voice.voiceName
      );

      if (!isSpeechActiveRef.current) {
        setIsSpeechLoading(false);
        setSpeechLoadingMessageId(null);
        return;
      }

      if (res.audioData && !res.fallbackToBrowser) {
        const audioSrc = `data:${res.mimeType || 'audio/mp3'};base64,${res.audioData}`;
        preppedAudio.src = audioSrc;
        preppedAudio.playbackRate = Math.max(0.75, Math.min(1.4, settings.voice.voiceRate || 1.0));

        preppedAudio.onplay = () => {
          setIsSpeechLoading(false);
          setSpeechLoadingMessageId(null);
          setIsSpeaking(true);
          setIsSpeechPaused(false);
          setSpeakingMessageId(messageId);
        };

        preppedAudio.ontimeupdate = () => {
          if (isSpeechActiveRef.current) {
            pausedTimeRef.current = preppedAudio.currentTime;
          }
        };

        preppedAudio.onended = () => {
          setIsSpeaking(false);
          setIsSpeechPaused(false);
          setSpeakingMessageId(null);
          setIsSpeechLoading(false);
          setSpeechLoadingMessageId(null);
          pausedTimeRef.current = 0;
          activeAudioRef.current = null;
          isSpeechActiveRef.current = false;
        };

        preppedAudio.onerror = () => {
          setIsSpeechLoading(false);
          setSpeechLoadingMessageId(null);
          activeAudioRef.current = null;
          if (isSpeechActiveRef.current) {
            playSpeechChunk(messageId, chunks, 0);
          }
        };

        audioCacheRef.current.set(messageId, preppedAudio);
        await preppedAudio.play();
        return;
      }
    } catch (err) {
      console.warn('Neural TTS generation, falling back to client synthesis:', err);
    }

    setIsSpeechLoading(false);
    setSpeechLoadingMessageId(null);

    // Fallback to client-side natural speech synthesizer
    if (isSpeechActiveRef.current) {
      playSpeechChunk(messageId, chunks, 0);
    }
  };

  const pauseSpeech = () => {
    isSpeechActiveRef.current = false;

    if (activeAudioRef.current) {
      pausedTimeRef.current = activeAudioRef.current.currentTime;
      activeAudioRef.current.pause();
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const curIndex = speechIndexRef.current;
      const curChunk = currentChunkTextRef.current || (speechQueueRef.current[curIndex] || '');

      if (curChunk) {
        const wordOffset = currentWordCharOffsetRef.current;
        const wordLen = currentWordLengthRef.current;
        const nextCharPos = wordOffset + wordLen;

        const remainingInChunk = curChunk.slice(nextCharPos).trim();

        if (remainingInChunk.length > 0) {
          // Replace current chunk with unread portion so resume starts from the EXACT next word!
          speechQueueRef.current[curIndex] = remainingInChunk;
          pausedChunkIndexRef.current = curIndex;
        } else {
          // Current chunk was completed or at the very end
          pausedChunkIndexRef.current = curIndex + 1;
        }
      } else {
        pausedChunkIndexRef.current = curIndex;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setIsSpeaking(false);
    setIsSpeechPaused(true);
    setIsSpeechLoading(false);
    setSpeechLoadingMessageId(null);

    if (settings.soundEffects) {
      chimeSynthesizer.play('voice_stop');
    }
  };

  const resumeSpeech = async (messageId?: string, text?: string) => {
    const targetMsgId = messageId || speakingMessageId || savedMessageIdRef.current;
    if (!targetMsgId) return;

    // 1. If audio element is loaded in memory for this message
    const cachedAudio = (targetMsgId === speakingMessageId && activeAudioRef.current)
      ? activeAudioRef.current
      : audioCacheRef.current.get(targetMsgId);

    if (cachedAudio && pausedTimeRef.current >= 0) {
      activeAudioRef.current = cachedAudio;
      isSpeechActiveRef.current = true;
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setSpeakingMessageId(targetMsgId);

      cachedAudio.currentTime = pausedTimeRef.current;
      try {
        await cachedAudio.play();
        return;
      } catch (err) {
        console.warn('Error resuming cached audio, falling back:', err);
      }
    }

    // 2. Client browser synthesis from paused chunk index (sliced to exact next word!)
    if (speechQueueRef.current.length > 0 && pausedChunkIndexRef.current < speechQueueRef.current.length) {
      isSpeechActiveRef.current = true;
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setSpeakingMessageId(targetMsgId);
      playSpeechChunk(targetMsgId, speechQueueRef.current, pausedChunkIndexRef.current);
      return;
    }

    // 3. Otherwise start fresh if text is available
    const targetText = text || savedTextRef.current;
    if (targetText) {
      speakText(targetMsgId, targetText, true);
    }
  };

  const stopSpeech = () => {
    isSpeechActiveRef.current = false;
    speechQueueRef.current = [];
    speechIndexRef.current = 0;
    pausedTimeRef.current = 0;
    pausedChunkIndexRef.current = 0;
    currentChunkTextRef.current = '';
    currentWordCharOffsetRef.current = 0;
    currentWordLengthRef.current = 0;
    lastSpokenWordRef.current = '';

    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setIsSpeechLoading(false);
    setSpeechLoadingMessageId(null);
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setSpeakingMessageId(null);

    if (settings.soundEffects) {
      chimeSynthesizer.play('voice_stop');
    }
  };

  return (
    <AIContext.Provider
      value={{
        sessions,
        currentSession,
        settings,
        isSidebarOpen,
        isSettingsOpen,
        isImagineOpen,
        isGenerating,
        activeCanvasArtifact,
        isSpeaking,
        isSpeechPaused,
        speakingMessageId,
        isSpeechLoading,
        speechLoadingMessageId,
        createNewSession,
        selectSession,
        deleteSession,
        renameSession,
        pinSession,
        clearAllSessions,
        sendMessage,
        regenerateMessage,
        stopGenerating,
        updateSettings,
        setSidebarOpen,
        setSettingsOpen,
        setImagineOpen,
        openCanvas,
        closeCanvas,
        speakText,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
        activeModel,
        setActiveModel,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
