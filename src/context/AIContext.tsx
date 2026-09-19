import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  AIModelType,
  AppSettings,
  ChatMessage,
  ChatSession,
  ConversationDateGroups,
  ConversationSummary,
  CustomInstructions,
  GroundingSource,
  MessageAttachment,
  User,
  AIMemoryItem,
} from '../types';
import {
  streamChat,
  synthesizeNeuralSpeech,
  authenticateSession,
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  saveConversationMessage,
  saveConversationMessagesBatch,
  migrateLegacySessions,
  fetchAIMemories,
  saveAIMemory,
  deleteAIMemory,
  getStoredUser,
} from '../services/api';
import {
  chunkTextForSpeech,
  cleanTextForSpeech,
  resolveBestVoice,
  chimeSynthesizer,
  VOICE_PERSONAS,
} from '../utils/voiceEngine';
import { sanitizeBrandLeaks } from '../utils/sanitizeBrand';

const DEFAULT_INSTRUCTIONS: CustomInstructions = {
  enabled: false,
  userBio: '',
  responsePreferences: '',
  userName: '',
  preferredLanguage: 'auto',
  preferredTone: 'friendly',
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
  conversationSummaries: ConversationSummary[];
  conversationGroups: ConversationDateGroups;
  currentSession: ChatSession | null;
  isLoadingConversation: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  currentUser: User | null;

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

  // Conversations Actions
  createNewSession: (initialModel?: AIModelType) => string;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string, permanent?: boolean) => Promise<void>;
  renameSession: (id: string, newTitle: string) => Promise<void>;
  pinSession: (id: string) => Promise<void>;
  archiveSession: (id: string, archived?: boolean) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  stopGenerating: () => void;
  refreshConversationsList: () => Promise<void>;

  // AI Memories (Requirement 15)
  memories: AIMemoryItem[];
  addMemory: (key: string, fact: string, category?: string) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;

  // Controls & Modals
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
const MIGRATION_DONE_KEY = 'hk_samrat_migrated_v2';

// Concise Title Generator for frontend first message (Requirement 12)
function extractConciseTitle(text: string): string {
  if (!text) return 'New Chat';
  let cleaned = text
    .replace(/^[\s\d.,!?;:()[\]"'_#*-]+/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .trim();

  const prefixes = [
    /^(please\s+tell\s+me|can\s+you\s+explain|how\s+to|what\s+is|who\s+is|tell\s+me\s+about|write\s+a|create\s+a)\s+/iu,
    /^(कृपया\s+|भाई\s+|मुझे\s+|जरा\s+|प्लीज\s+)?(बताओ|समझाओ|लिखो|बनाओ|सिखाओ|दिखाओ)\s*(कि)?\s*/iu,
    /^(kripya|bhai|mujhe|please)\s+/iu,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  cleaned = cleaned
    .replace(/\s+(बताओ|समझाओ|लिखकर दो|लिखो|प्लीज|बताइए|सिखाओ|दिखाओ|batao|bataiye|explain|karo|bata do)[?!।.\s]*$/iu, '')
    .trim();

  if (cleaned.length > 36) {
    const truncated = cleaned.slice(0, 36);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 16) {
      cleaned = truncated.slice(0, lastSpace);
    } else {
      cleaned = truncated;
    }
  }

  return cleaned || text.slice(0, 24).trim() || 'New Chat';
}

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sanitize legacy hardcoded 'HK Developer' from previous default settings
        if (parsed.customInstructions?.userName === 'HK Developer') {
          parsed.customInstructions.userName = '';
          parsed.customInstructions.enabled = false;
        }
        if (parsed.customInstructions?.userBio?.includes('passionate builder, student, and creator looking for fast, top-tier AI assistance')) {
          parsed.customInstructions.userBio = '';
        }
        if (parsed.customInstructions?.responsePreferences?.includes('Provide clear, actionable, deep yet concise responses with code examples')) {
          parsed.customInstructions.responsePreferences = '';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Current active user
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());

  // Conversation summaries and date groups for sidebar
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [conversationGroups, setConversationGroups] = useState<ConversationDateGroups>({
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  });

  // In-memory cache of loaded full chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // REQUIREMENT 2 (APP OPEN BEHAVIOR):
  // Clean New Chat state on app launch - DO NOT auto load old messages on screen!
  const [currentSession, setCurrentSession] = useState<ChatSession>(() => ({
    id: 'session_' + Date.now(),
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    model: settings.defaultModel,
  }));

  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [memories, setMemories] = useState<AIMemoryItem[]>([]);

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

  // Sync settings to localStorage & apply theme class
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }

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

  // Load conversations list from backend
  const refreshConversationsList = useCallback(async () => {
    try {
      const data = await fetchConversations({
        archived: showArchived,
        search: searchQuery,
      });
      setConversationSummaries(data.conversations || []);
      setConversationGroups(data.groups || { today: [], yesterday: [], previous7Days: [], older: [] });
    } catch (err) {
      console.warn('Failed to load conversations list:', err);
    }
  }, [showArchived, searchQuery]);

  // Initial App Mount: Auth, silent legacy migration, and load conversation list
  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      try {
        // 1. Establish/verify user session
        const user = await authenticateSession();
        if (isMounted) setCurrentUser(user);

        // 2. Silent legacy migration (Requirement 14)
        const migrationDone = localStorage.getItem(MIGRATION_DONE_KEY);
        if (!migrationDone) {
          const rawStored = localStorage.getItem(STORAGE_KEY_SESSIONS);
          if (rawStored) {
            try {
              const legacy = JSON.parse(rawStored);
              if (Array.isArray(legacy) && legacy.length > 0) {
                await migrateLegacySessions(legacy);
              }
            } catch {}
          }
          localStorage.setItem(MIGRATION_DONE_KEY, 'true');
        }

        // 3. Load conversations metadata for sidebar
        const convData = await fetchConversations({ archived: false });
        if (isMounted) {
          setConversationSummaries(convData.conversations || []);
          setConversationGroups(convData.groups || { today: [], yesterday: [], previous7Days: [], older: [] });
        }

        // 4. Load AI memories (Requirement 15)
        const memData = await fetchAIMemories();
        if (isMounted) setMemories(memData);
      } catch (err) {
        console.error('App initialization error:', err);
      }
    }

    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Re-fetch conversations when search or archive filter changes
  useEffect(() => {
    refreshConversationsList();
  }, [refreshConversationsList]);

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

  // REQUIREMENT 1 & 11: NEW CHAT
  // "New Chat दबाने पर बिल्कुल नई conversation create हो।
  //  नई conversation में कोई previous messages दिखाई न दें।
  //  New Chat का नया unique conversation_id बने।
  //  Old chats delete न हों।"
  const createNewSession = (initialModel?: AIModelType): string => {
    const newId = 'session_' + Date.now();
    const fresh: ChatSession = {
      id: newId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: initialModel || activeModel || settings.defaultModel,
    };

    setCurrentSession(fresh);
    setActiveCanvasArtifact(null);
    stopSpeech();
    return newId;
  };

  // REQUIREMENT 3 & 10: SELECT SESSION FROM SIDEBAR
  // "User जब किसी previous conversation पर click करे, तभी वो conversation open हो।"
  const selectSession = async (id: string) => {
    // If it's already current and loaded, do nothing
    if (currentSession?.id === id && currentSession.messages.length > 0) return;

    setIsLoadingConversation(true);
    stopSpeech();

    try {
      // Check in-memory session cache first
      const cached = sessions.find((s) => s.id === id);
      if (cached && cached.messages.length > 0) {
        setCurrentSession(cached);
        setActiveModel(cached.model || settings.defaultModel);
      }

      // Fetch verified state from database
      const data = await fetchConversation(id);
      if (data && data.conversation) {
        const fullSession: ChatSession = {
          id: data.conversation.id,
          userId: data.conversation.userId,
          title: data.conversation.title,
          model: (data.conversation.model as AIModelType) || settings.defaultModel,
          createdAt: data.conversation.createdAt,
          updatedAt: data.conversation.updatedAt,
          isPinned: data.conversation.isPinned,
          archived: data.conversation.archived,
          messages: data.messages || [],
        };

        setCurrentSession(fullSession);
        setActiveModel(fullSession.model);

        // Update local memory cache
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = fullSession;
            return copy;
          }
          return [fullSession, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to select conversation:', err);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // REQUIREMENT 5 & 11: DELETE CHAT
  // "Delete दबाने पर सिर्फ वही conversation delete हो, बाकी conversations सुरक्षित रहें।
  //  New Chat और Delete Chat को अलग रखो।"
  const deleteSession = async (id: string, permanent: boolean = false) => {
    try {
      await deleteConversation(id, permanent);

      // Remove from summaries
      setConversationSummaries((prev) => prev.filter((c) => c.id !== id));
      setSessions((prev) => prev.filter((s) => s.id !== id));

      // If the currently open conversation was deleted, switch cleanly to a fresh New Chat!
      if (currentSession?.id === id) {
        createNewSession();
      }

      await refreshConversationsList();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // REQUIREMENT 5: RENAME CHAT
  const renameSession = async (id: string, newTitle: string) => {
    const cleanTitle = newTitle.trim() || 'Untitled Chat';
    try {
      await updateConversation(id, { title: cleanTitle });

      if (currentSession?.id === id) {
        setCurrentSession((prev) => (prev ? { ...prev, title: cleanTitle, updatedAt: Date.now() } : prev));
      }

      setConversationSummaries((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: cleanTitle, updatedAt: Date.now() } : c))
      );

      await refreshConversationsList();
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  // REQUIREMENT 5: PIN CHAT
  const pinSession = async (id: string) => {
    const target = conversationSummaries.find((c) => c.id === id);
    const newPinned = !target?.isPinned;

    try {
      await updateConversation(id, { isPinned: newPinned });

      if (currentSession?.id === id) {
        setCurrentSession((prev) => (prev ? { ...prev, isPinned: newPinned } : prev));
      }

      await refreshConversationsList();
    } catch (err) {
      console.error('Failed to pin session:', err);
    }
  };

  // REQUIREMENT 5: ARCHIVE CHAT
  const archiveSession = async (id: string, archived = true) => {
    try {
      await updateConversation(id, { archived });
      if (currentSession?.id === id && archived) {
        createNewSession();
      }
      await refreshConversationsList();
    } catch (err) {
      console.error('Failed to archive session:', err);
    }
  };

  // Clear all chats
  const clearAllSessions = async () => {
    for (const conv of conversationSummaries) {
      try {
        await deleteConversation(conv.id, true);
      } catch {}
    }
    setConversationSummaries([]);
    setSessions([]);
    createNewSession();
    await refreshConversationsList();
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

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

  // REQUIREMENT 6, 7, 8, 12: SEND MESSAGE WITH DATABASE AUTO-SAVE & CONCISE TITLE
  const sendMessage = async (content: string, attachments: MessageAttachment[] = []) => {
    const trimmed = content.trim();
    const cleanCmd = trimmed.toLowerCase().replace(/[.,!?:;|।\-_]/g, ' ').replace(/\s+/g, ' ').trim();

    // Voice & Playback Command Matchers
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

    if ((!trimmed && attachments.length === 0) || (isGenerating && !isStopCommand)) return;

    let activeSession = currentSession;
    if (!activeSession) {
      const newId = createNewSession();
      activeSession = {
        id: newId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: activeModel,
      };
      setCurrentSession(activeSession);
    }

    const targetConvId = activeSession.id;

    // Handle STOP command
    if (isStopCommand) {
      if (isGenerating) stopGenerating();
      pauseSpeech();

      const userMessage: ChatMessage = {
        id: 'msg_user_' + Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
      };
      const assistantMessage: ChatMessage = {
        id: 'msg_asst_' + (Date.now() + 1),
        role: 'assistant',
        content: '⏸️ **बोलना रोक दिया गया है।** आपकी वर्तमान स्थिति सुरक्षित है।\n\nजब भी आप तैयार हों, **"आगे बोलो"** कहें या **Resume** बटन दबाएं।',
        timestamp: Date.now() + 1,
        modelUsed: activeModel,
      };

      const updated = {
        ...activeSession,
        updatedAt: Date.now(),
        messages: [...activeSession.messages, userMessage, assistantMessage],
      };
      setCurrentSession(updated);

      // Save to database
      saveConversationMessage(targetConvId, userMessage).catch(() => {});
      saveConversationMessage(targetConvId, assistantMessage).catch(() => {});
      return;
    }

    // Handle RESUME command
    if (isResumeCommand) {
      resumeSpeech();
      const userMessage: ChatMessage = {
        id: 'msg_user_' + Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        attachments,
      };
      const assistantMessage: ChatMessage = {
        id: 'msg_asst_' + (Date.now() + 1),
        role: 'assistant',
        content: '▶️ **जारी किया जा रहा है...** जहाँ से रोका गया था, ठीक वहीं से बिना किसी दोहराव के बोलना शुरू कर रहा हूँ।',
        timestamp: Date.now() + 1,
        modelUsed: activeModel,
      };

      const updated = {
        ...activeSession,
        updatedAt: Date.now(),
        messages: [...activeSession.messages, userMessage, assistantMessage],
      };
      setCurrentSession(updated);

      saveConversationMessage(targetConvId, userMessage).catch(() => {});
      saveConversationMessage(targetConvId, assistantMessage).catch(() => {});
      return;
    }

    // Handle SPEAK command
    if (isSpeakCommand && !isSpeaking) {
      const lastAsst = [...activeSession.messages].reverse().find((m) => m.role === 'assistant' && m.content);
      if (lastAsst) {
        speakText(lastAsst.id, lastAsst.content, true);
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

    const isFirstMessage = activeSession.messages.length === 0;

    // REQUIREMENT 12: Smart concise title (3-6 words, strips "बताओ")
    const conciseTitle = isFirstMessage ? extractConciseTitle(content) : activeSession.title;

    // 1. If first message, create conversation in database immediately
    if (isFirstMessage) {
      createConversation({
        id: targetConvId,
        title: conciseTitle,
        model: activeModel,
      }).catch((e) => console.warn('DB conversation creation error:', e));
    }

    // 2. Persist user message to database
    saveConversationMessage(targetConvId, userMessage).catch((e) =>
      console.warn('DB save user message error:', e)
    );

    const updatedMessages = [...activeSession.messages, userMessage];

    // Optimistically update screen
    setCurrentSession({
      ...activeSession,
      title: conciseTitle,
      updatedAt: Date.now(),
      messages: [...updatedMessages, initialAssistantMessage],
    });

    setIsGenerating(true);
    const startTime = Date.now();

    if (settings.soundEffects) {
      chimeSynthesizer.play('send');
    }

    let latestAccumulatedText = '';

    const cancelStream = await streamChat({
      messages: updatedMessages,
      model: activeModel,
      enableSearchGrounding: settings.enableSearchGrounding || activeModel === 'samrat-search',
      enableThinkingProcess: settings.enableThinkingProcess || activeModel === 'samrat-reasoner',
      thinkingEffort: settings.thinkingEffort,
      temperature: settings.temperature,
      customInstructions: settings.customInstructions,
      onStart: () => {},
      onChunk: (chunk: string) => {
        latestAccumulatedText += chunk;
        setCurrentSession((prev) => {
          if (!prev || prev.id !== targetConvId) return prev;
          const msgs = prev.messages.map((m) => {
            if (m.id === assistantMessageId) {
              return { ...m, content: m.content + chunk };
            }
            return m;
          });
          return { ...prev, messages: msgs };
        });
      },
      onDone: (fullText: string, sources: GroundingSource[]) => {
        const sanitizedText = sanitizeBrandLeaks(fullText);
        const duration = Date.now() - startTime;
        const artifact = detectCodeArtifact(sanitizedText);

        const finalAssistantMsg: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: sanitizedText,
          timestamp: Date.now(),
          isStreaming: false,
          groundingSources: sources,
          thinkingDurationMs: duration,
          codeArtifact: artifact,
          modelUsed: activeModel,
        };

        setCurrentSession((prev) => {
          if (!prev || prev.id !== targetConvId) return prev;
          const msgs = prev.messages.map((m) => (m.id === assistantMessageId ? finalAssistantMsg : m));
          return { ...prev, messages: msgs };
        });

        setIsGenerating(false);

        // REQUIREMENT 6: Auto save completed response to DB
        saveConversationMessage(targetConvId, finalAssistantMsg)
          .then(() => refreshConversationsList())
          .catch((e) => console.warn('DB save assistant message error:', e));

        if (settings.soundEffects) {
          chimeSynthesizer.play('receive');
        }

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
          displayError.includes('google')
        ) {
          displayError = 'HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया कुछ पलों बाद "Retry Message" पर क्लिक करें।';
        }

        const fallbackContent = latestAccumulatedText || `⚠️ ${displayError}`;

        const partialAssistantMsg: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: fallbackContent,
          timestamp: Date.now(),
          isStreaming: false,
          modelUsed: activeModel,
        };

        setCurrentSession((prev) => {
          if (!prev || prev.id !== targetConvId) return prev;
          const msgs = prev.messages.map((m) => (m.id === assistantMessageId ? partialAssistantMsg : m));
          return { ...prev, messages: msgs };
        });

        setIsGenerating(false);

        // REQUIREMENT 7: Preserve incomplete / interrupted message in database
        saveConversationMessage(targetConvId, partialAssistantMsg)
          .then(() => refreshConversationsList())
          .catch(() => {});
      },
    });

    abortControllerRef.current = cancelStream;
  };

  const regenerateMessage = async (messageId: string) => {
    if (!currentSession || isGenerating) return;
    const msgIndex = currentSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const historyUpToUser = currentSession.messages.slice(0, msgIndex);
    const lastUserMsg = currentSession.messages[msgIndex - 1];

    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    setCurrentSession((prev) => (prev ? { ...prev, messages: historyUpToUser } : prev));
    await sendMessage(lastUserMsg.content, lastUserMsg.attachments);
  };

  // REQUIREMENT 15: AI MEMORY MANAGEMENT (Separate from Conversation History)
  const addMemory = async (key: string, fact: string, category: string = 'preference') => {
    try {
      const saved = await saveAIMemory(key, fact, category);
      if (saved) {
        setMemories((prev) => {
          const idx = prev.findIndex((m) => m.id === saved.id || m.key.toLowerCase() === key.toLowerCase());
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [saved, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to add AI memory:', err);
    }
  };

  const removeMemory = async (id: string) => {
    try {
      await deleteAIMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to remove AI memory:', err);
    }
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

  // SPEECH ENGINE (Fully preserving emoji stripper & boundary tracking)
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

    utterance.rate = Math.max(0.75, Math.min(1.4, settings.voice.voiceRate || 1.0));
    utterance.pitch = Math.max(0.85, Math.min(1.15, settings.voice.voicePitch || 1.0));

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
        setTimeout(() => {
          if (isSpeechActiveRef.current) {
            playSpeechChunk(messageId, chunks, index + 1);
          }
        }, 50);
      }
    };

    utterance.onerror = (e: any) => {
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
      } catch {}
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

    const preppedAudio = new Audio();
    activeAudioRef.current = preppedAudio;

    if (settings.soundEffects) {
      chimeSynthesizer.play('voice_start');
    }

    try {
      const cleanSpokenText = cleanTextForSpeech(text);
      const res = await synthesizeNeuralSpeech(
        cleanSpokenText || text,
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
      console.warn('Neural TTS fallback to client synthesis:', err);
    }

    setIsSpeechLoading(false);
    setSpeechLoadingMessageId(null);

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
          speechQueueRef.current[curIndex] = remainingInChunk;
          pausedChunkIndexRef.current = curIndex;
        } else {
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

    if (speechQueueRef.current.length > 0 && pausedChunkIndexRef.current < speechQueueRef.current.length) {
      isSpeechActiveRef.current = true;
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setSpeakingMessageId(targetMsgId);
      playSpeechChunk(targetMsgId, speechQueueRef.current, pausedChunkIndexRef.current);
      return;
    }

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
        conversationSummaries,
        conversationGroups,
        currentSession,
        isLoadingConversation,
        searchQuery,
        setSearchQuery,
        showArchived,
        setShowArchived,
        currentUser,
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
        archiveSession,
        clearAllSessions,
        sendMessage,
        regenerateMessage,
        stopGenerating,
        refreshConversationsList,
        memories,
        addMemory,
        removeMemory,
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

