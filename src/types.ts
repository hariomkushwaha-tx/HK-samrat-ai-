export type AIModelType = 'samrat-turbo' | 'samrat-reasoner' | 'samrat-search' | 'samrat-architect' | 'samrat-imagine';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: AIModelType;
  thoughtProcess?: string;
  isThinkingOpen?: boolean;
  thinkingDurationMs?: number;
  groundingSources?: GroundingSource[];
  attachments?: MessageAttachment[];
  isStreaming?: boolean;
  codeArtifact?: {
    type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python';
    title: string;
    code: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: AIModelType;
  isPinned?: boolean;
  tags?: string[];
}

export interface CustomInstructions {
  enabled: boolean;
  userBio: string; // "What would you like HK Samrat AI to know about you?"
  responsePreferences: string; // "How would you like HK Samrat AI to respond?"
  userName: string;
  preferredLanguage: 'auto' | 'english' | 'hindi' | 'hinglish';
  preferredTone: 'professional' | 'concise' | 'friendly' | 'creative' | 'technical';
}

export type VoicePersonaId = 'aaradhya' | 'arjun' | 'priya' | 'rohan' | 'serena' | 'alex' | 'auto';

export interface VoiceSettings {
  autoSpeak: boolean;
  voiceRate: number; // 0.7 to 1.5
  voicePitch: number; // 0.8 to 1.3
  voiceName: string;
  persona: VoicePersonaId;
  language: string;
  smartLanguageDetection: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'midnight' | 'cyber-emerald' | 'light';
  defaultModel: AIModelType;
  enableSearchGrounding: boolean;
  enableThinkingProcess: boolean;
  thinkingEffort: 'HIGH' | 'LOW' | 'MINIMAL';
  temperature: number;
  streamingSpeed: 'hyper' | 'smooth' | 'instant';
  customInstructions: CustomInstructions;
  voice: VoiceSettings;
  fontSize: 'sm' | 'md' | 'lg';
  soundEffects: boolean;
  sendOnEnter: boolean;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  style: string;
  aspectRatio: string;
  createdAt: number;
}
