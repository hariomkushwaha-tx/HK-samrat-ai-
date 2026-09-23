import {
  AppSettings,
  ChatMessage,
  ConversationDateGroups,
  ConversationSummary,
  GroundingSource,
  User,
  AIMemoryItem,
} from '../types';

export const AUTH_STORAGE_KEY = 'hk_samrat_user_session_v1';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  if (user?.id) {
    headers['X-User-Id'] = user.id;
  }
  return headers;
}

// ---------------- USER AUTH API ----------------
export async function authenticateSession(profile?: {
  email?: string;
  name?: string;
  token?: string;
}): Promise<User> {
  const existing = getStoredUser();
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: profile?.email || existing?.email || 'hkdeveloperh@gmail.com',
        name: profile?.name || existing?.name || 'HK Samrat User',
        token: profile?.token || existing?.token,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        setStoredUser(data.user);
        return data.user;
      }
    }
  } catch (err) {
    console.warn('Server auth session unreachable, using local session fallback:', err);
  }

  const fallbackUser: User = existing || {
    id: 'usr_' + Date.now(),
    email: profile?.email || 'hkdeveloperh@gmail.com',
    name: profile?.name || 'HK Samrat User',
    token: profile?.token || 'tok_' + Math.random().toString(36).substring(2),
    createdAt: Date.now(),
  };
  setStoredUser(fallbackUser);
  return fallbackUser;
}

// ---------------- CONVERSATIONS API (Requirement 3, 4, 5, 6, 7, 8, 9) ----------------
export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  groups: ConversationDateGroups;
  total: number;
}

export async function fetchConversations(options?: {
  archived?: boolean;
  search?: string;
}): Promise<ListConversationsResponse> {
  const params = new URLSearchParams();
  if (options?.archived) params.set('archived', 'true');
  if (options?.search) params.set('q', options.search);

  try {
    const res = await fetch(`/api/conversations?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }

    if (res.status === 401) {
      // Re-authenticate session and retry once
      await authenticateSession();
      const retryRes = await fetch(`/api/conversations?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (retryRes.ok) return await retryRes.json();
    }
  } catch (err) {
    console.warn('Could not load conversations from server:', err);
  }

  return {
    conversations: [],
    groups: { today: [], yesterday: [], previous7Days: [], older: [] },
    total: 0,
  };
}

export async function fetchConversation(id: string): Promise<{
  conversation: ConversationSummary;
  messages: ChatMessage[];
}> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to load conversation details');
  }

  return await res.json();
}

export async function createConversation(data: {
  id?: string;
  title?: string;
  model?: string;
  metadata?: Record<string, any>;
}): Promise<ConversationSummary | null> {
  try {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      return json.conversation;
    }
  } catch (err) {
    console.warn('Could not create conversation on server:', err);
  }
  return null;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<ConversationSummary, 'title' | 'model' | 'archived' | 'isPinned' | 'metadata'>>
): Promise<ConversationSummary | null> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const json = await res.json();
      return json.conversation;
    }
  } catch (err) {
    console.warn('Could not update conversation on server:', err);
  }
  return null;
}

export async function deleteConversation(id: string, permanent: boolean = false): Promise<boolean> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}?permanent=${permanent}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const json = await res.json();
      return json.success ?? true;
    }
  } catch (err) {
    console.warn('Could not delete conversation on server:', err);
  }
  return false;
}

export async function saveConversationMessage(id: string, message: ChatMessage): Promise<void> {
  try {
    await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.warn('Could not save conversation message to server:', err);
  }
}

export async function saveConversationMessagesBatch(id: string, messages: ChatMessage[]): Promise<void> {
  try {
    await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    console.warn('Could not save messages batch to server:', err);
  }
}

export async function generateChatTitle(id: string, text?: string): Promise<ConversationSummary | null> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/title`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.conversation;
    }
  } catch (err) {
    console.warn('Could not generate chat title on server:', err);
  }
  return null;
}

export async function migrateLegacySessions(sessions: any[]): Promise<number> {
  try {
    const res = await fetch('/api/conversations/migrate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessions }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.migratedCount || 0;
  } catch {
    return 0;
  }
}

// ---------------- AI MEMORY API (Requirement 15) ----------------
export async function fetchAIMemories(): Promise<AIMemoryItem[]> {
  try {
    const res = await fetch('/api/memories', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.memories || [];
  } catch {
    return [];
  }
}

export async function saveAIMemory(key: string, fact: string, category: string = 'preference'): Promise<AIMemoryItem | null> {
  try {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, fact, category }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.memory;
  } catch {
    return null;
  }
}

export async function deleteAIMemory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/memories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------- STREAM CHAT ----------------
export interface StreamChatOptions {
  messages: ChatMessage[];
  model: string;
  enableSearchGrounding: boolean;
  enableThinkingProcess: boolean;
  thinkingEffort: 'HIGH' | 'LOW' | 'MINIMAL';
  temperature: number;
  customInstructions: AppSettings['customInstructions'];
  onChunk: (chunk: string) => void;
  onDone: (fullText: string, sources: GroundingSource[]) => void;
  onError: (error: string) => void;
  onStart?: () => void;
}

export async function streamChat(options: StreamChatOptions): Promise<() => void> {
  const controller = new AbortController();
  const {
    messages,
    model,
    enableSearchGrounding,
    enableThinkingProcess,
    thinkingEffort,
    temperature,
    customInstructions,
    onChunk,
    onDone,
    onError,
    onStart,
  } = options;

  try {
    const clientTime = new Date().toISOString();
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        model,
        enableSearchGrounding,
        enableThinkingProcess,
        thinkingEffort,
        temperature,
        customInstructions,
        clientTime,
        clientTimeZone,
      }),
    });

    if (!response.ok) {
      let errorDetails = 'HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया पुनः प्रयास करें।';
      try {
        const errorJson = await response.json();
        const msg = errorJson.error || errorJson.message;
        if (msg && typeof msg === 'string') {
          if (!msg.includes('API_KEY') && !msg.includes('Google') && !msg.includes('gemini') && !msg.includes('Vercel')) {
            errorDetails = msg;
          }
        }
      } catch {}
      throw new Error(errorDetails);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported in this environment');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';
    let sources: GroundingSource[] = [];

    const processBuffer = () => {
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(rawData);

            if (currentEvent === 'start') {
              onStart?.();
            } else if (currentEvent === 'chunk') {
              const text = parsed.text || '';
              accumulatedText += text;
              onChunk(text);
            } else if (currentEvent === 'done') {
              sources = parsed.groundingSources || [];
              onDone(parsed.fullText || accumulatedText, sources);
            } else if (currentEvent === 'error') {
              onError(parsed.message || 'Stream error');
            }
          } catch {
            // Ignored non-json chunk
          }
        }
      }
    };

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
        processBuffer();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError('HK Samrat AI सर्वर में समस्या आ रही है। कृपया कुछ पलों बाद "Retry Message" पर क्लिक करें।');
        }
      }
    };

    readStream();
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      onError('HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया कुछ पलों बाद पुनः प्रयास करें।');
    }
  }

  return () => {
    controller.abort();
  };
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('Prompt enhancement failed');
    const data = await res.json();
    return data.enhancedPrompt || prompt;
  } catch (err) {
    console.error(err);
    return prompt;
  }
}

export async function generateImagineArt(prompt: string, style: string, aspectRatio: string = '1:1') {
  const res = await fetch('/api/imagine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, aspectRatio }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Imagine generation failed');
  }
  return await res.json();
}

export interface NeuralTTSResponse {
  audioData?: string;
  audioUrl?: string;
  mimeType?: string;
  source?: 'samrat_neural' | 'samrat_expressive_neural' | 'samrat_master_neural' | 'browser' | string;
  voice?: string;
  fallbackToBrowser?: boolean;
}

export async function synthesizeNeuralSpeech(
  text: string,
  persona?: string,
  voiceName?: string
): Promise<NeuralTTSResponse> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, persona, voiceName }),
    });
    if (!res.ok) {
      return { fallbackToBrowser: true };
    }
    return await res.json();
  } catch {
    return { fallbackToBrowser: true };
  }
}

