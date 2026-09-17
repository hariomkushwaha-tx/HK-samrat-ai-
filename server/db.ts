import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  isPinned: boolean;
  deletedAt: number | null;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  thoughtProcess?: string;
  isThinkingOpen?: boolean;
  thinkingDurationMs?: number;
  groundingSources?: Array<{ title: string; url: string; snippet?: string }>;
  attachments?: Array<{ id: string; name: string; mimeType: string; data: string; previewUrl?: string }>;
  codeArtifact?: {
    type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python';
    title: string;
    code: string;
  };
}

export interface AIMemory {
  id: string;
  userId: string;
  key: string;
  fact: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory caches for high throughput
let usersCache: User[] = [];
let conversationsCache: Conversation[] = [];
let messagesCache: Message[] = [];
let memoriesCache: AIMemory[] = [];

// Atomic write helper with renameSync to prevent corruption on crash
function atomicWriteFile(filePath: string, data: any) {
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substr(2, 6)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Error atomically writing to ${filePath}:`, err);
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
  }
}

function loadJSON<T>(filePath: string, fallback: T[]): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn(`Could not read ${filePath}, using fallback`, err);
  }
  return fallback;
}

// Initialize tables from disk
function initDatabase() {
  usersCache = loadJSON<User>(USERS_FILE, []);
  conversationsCache = loadJSON<Conversation>(CONVERSATIONS_FILE, []);
  messagesCache = loadJSON<Message>(MESSAGES_FILE, []);
  memoriesCache = loadJSON<AIMemory>(MEMORIES_FILE, []);

  // Guarantee a default administrator/developer user exists
  const defaultEmail = 'hkdeveloperh@gmail.com';
  let defaultUser = usersCache.find((u) => u.email === defaultEmail);
  if (!defaultUser) {
    defaultUser = {
      id: 'usr_hk_founder',
      email: defaultEmail,
      name: 'Hariom Kushwaha (Founder)',
      token: 'hk_founder_token_786',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    usersCache.push(defaultUser);
    atomicWriteFile(USERS_FILE, usersCache);
  }
}

initDatabase();

export const db = {
  // ---------------- AUTH & USERS ----------------
  getUserByToken(token: string): User | null {
    if (!token) return null;
    return usersCache.find((u) => u.token === token) || null;
  },

  getUserById(id: string): User | null {
    if (!id) return null;
    return usersCache.find((u) => u.id === id) || null;
  },

  getOrCreateUser(email?: string, name?: string, token?: string): User {
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Check by token first
    if (token) {
      const existingByToken = usersCache.find((u) => u.token === token);
      if (existingByToken) return existingByToken;
    }

    // Check by email if provided
    if (cleanEmail) {
      const existingByEmail = usersCache.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingByEmail) {
        if (token && !existingByEmail.token) {
          existingByEmail.token = token;
          atomicWriteFile(USERS_FILE, usersCache);
        }
        return existingByEmail;
      }
    }

    // Create new user
    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: cleanEmail || `user_${Math.random().toString(36).substr(2, 6)}@hksamrat.ai`,
      name: name || 'HK Samrat Explorer',
      token: token || 'tok_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    usersCache.push(newUser);
    atomicWriteFile(USERS_FILE, usersCache);
    return newUser;
  },

  // ---------------- CONVERSATIONS ----------------
  listConversations(
    userId: string,
    options: {
      includeArchived?: boolean;
      searchQuery?: string;
    } = {}
  ) {
    const { includeArchived = false, searchQuery = '' } = options;
    const query = searchQuery.trim().toLowerCase();

    let userConvs = conversationsCache.filter(
      (c) => c.userId === userId && c.deletedAt === null
    );

    if (!includeArchived) {
      userConvs = userConvs.filter((c) => !c.archived);
    } else {
      userConvs = userConvs.filter((c) => c.archived);
    }

    if (query) {
      userConvs = userConvs.filter((c) => {
        const titleMatch = c.title.toLowerCase().includes(query);
        if (titleMatch) return true;
        // Search in messages of this conversation
        const hasMsgMatch = messagesCache.some(
          (m) => m.conversationId === c.id && m.content.toLowerCase().includes(query)
        );
        return hasMsgMatch;
      });
    }

    // Sort by pinned first, then by updatedAt descending
    userConvs.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

    // Attach message counts and last message previews
    return userConvs.map((c) => {
      const convMsgs = messagesCache
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      const lastMsg = convMsgs[convMsgs.length - 1];
      const preview = lastMsg ? (lastMsg.content.slice(0, 80).replace(/[\n\r]+/g, ' ') + (lastMsg.content.length > 80 ? '...' : '')) : '';

      return {
        ...c,
        messageCount: convMsgs.length,
        lastMessagePreview: preview,
      };
    });
  },

  getConversation(userId: string, conversationId: string): Conversation | null {
    const conv = conversationsCache.find(
      (c) => c.id === conversationId && c.userId === userId && c.deletedAt === null
    );
    return conv || null;
  },

  createConversation(
    userId: string,
    data: {
      id?: string;
      title?: string;
      model?: string;
      metadata?: Record<string, any>;
    }
  ): Conversation {
    const id = data.id || 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    // Check if already exists (e.g. pre-allocated ID)
    const existing = conversationsCache.find((c) => c.id === id);
    if (existing) {
      if (existing.userId === userId) return existing;
      throw new Error('Conversation ID conflict');
    }

    const now = Date.now();
    const newConv: Conversation = {
      id,
      userId,
      title: (data.title || 'New Chat').trim(),
      model: data.model || 'samrat-turbo',
      createdAt: now,
      updatedAt: now,
      archived: false,
      isPinned: false,
      deletedAt: null,
      metadata: data.metadata || {},
    };

    conversationsCache.unshift(newConv);
    atomicWriteFile(CONVERSATIONS_FILE, conversationsCache);
    return newConv;
  },

  updateConversation(
    userId: string,
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title' | 'model' | 'archived' | 'isPinned' | 'metadata'>>
  ): Conversation | null {
    const conv = conversationsCache.find(
      (c) => c.id === conversationId && c.userId === userId && c.deletedAt === null
    );
    if (!conv) return null;

    if (updates.title !== undefined) conv.title = updates.title.trim() || 'Untitled Chat';
    if (updates.model !== undefined) conv.model = updates.model;
    if (updates.archived !== undefined) conv.archived = updates.archived;
    if (updates.isPinned !== undefined) conv.isPinned = updates.isPinned;
    if (updates.metadata !== undefined) conv.metadata = { ...conv.metadata, ...updates.metadata };

    conv.updatedAt = Date.now();
    atomicWriteFile(CONVERSATIONS_FILE, conversationsCache);
    return conv;
  },

  deleteConversation(userId: string, conversationId: string, permanent: boolean = false): boolean {
    const convIndex = conversationsCache.findIndex(
      (c) => c.id === conversationId && c.userId === userId
    );
    if (convIndex === -1) return false;

    if (permanent) {
      conversationsCache.splice(convIndex, 1);
      // Remove messages
      messagesCache = messagesCache.filter((m) => m.conversationId !== conversationId);
      atomicWriteFile(MESSAGES_FILE, messagesCache);
    } else {
      conversationsCache[convIndex].deletedAt = Date.now();
    }

    atomicWriteFile(CONVERSATIONS_FILE, conversationsCache);
    return true;
  },

  // ---------------- MESSAGES ----------------
  listMessages(userId: string, conversationId: string): Message[] {
    // Verify user owns conversation
    const conv = conversationsCache.find(
      (c) => c.id === conversationId && c.userId === userId && c.deletedAt === null
    );
    if (!conv) return [];

    return messagesCache
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  saveMessage(userId: string, message: Message): Message {
    // Check conversation exists or create on the fly
    let conv = conversationsCache.find(
      (c) => c.id === message.conversationId && c.userId === userId
    );

    if (!conv) {
      conv = this.createConversation(userId, {
        id: message.conversationId,
        title: message.role === 'user' ? generateConciseTitle(message.content) : 'New Chat',
        model: message.modelUsed || 'samrat-turbo',
      });
    } else {
      // Update conversation updatedAt
      conv.updatedAt = Date.now();
      if (message.modelUsed && message.modelUsed !== conv.model) {
        conv.model = message.modelUsed;
      }
    }

    const existingIndex = messagesCache.findIndex((m) => m.id === message.id);
    if (existingIndex !== -1) {
      messagesCache[existingIndex] = { ...messagesCache[existingIndex], ...message, userId };
    } else {
      messagesCache.push({ ...message, userId });
    }

    atomicWriteFile(MESSAGES_FILE, messagesCache);
    atomicWriteFile(CONVERSATIONS_FILE, conversationsCache);
    return message;
  },

  saveMessagesBatch(userId: string, conversationId: string, messages: Message[]): void {
    let conv = conversationsCache.find((c) => c.id === conversationId && c.userId === userId);
    if (!conv && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      conv = this.createConversation(userId, {
        id: conversationId,
        title: firstUserMsg ? generateConciseTitle(firstUserMsg.content) : 'Imported Chat',
        model: messages[0].modelUsed || 'samrat-turbo',
      });
    }

    if (conv) {
      conv.updatedAt = Date.now();
    }

    for (const msg of messages) {
      const idx = messagesCache.findIndex((m) => m.id === msg.id);
      if (idx !== -1) {
        messagesCache[idx] = { ...messagesCache[idx], ...msg, userId, conversationId };
      } else {
        messagesCache.push({ ...msg, userId, conversationId });
      }
    }

    atomicWriteFile(MESSAGES_FILE, messagesCache);
    atomicWriteFile(CONVERSATIONS_FILE, conversationsCache);
  },

  // ---------------- AI MEMORIES (Requirement 15) ----------------
  listMemories(userId: string): AIMemory[] {
    return memoriesCache.filter((m) => m.userId === userId);
  },

  saveMemory(userId: string, key: string, fact: string, category: string = 'preference'): AIMemory {
    const existing = memoriesCache.find((m) => m.userId === userId && m.key.toLowerCase() === key.toLowerCase());
    if (existing) {
      existing.fact = fact;
      existing.category = category;
      existing.updatedAt = Date.now();
      atomicWriteFile(MEMORIES_FILE, memoriesCache);
      return existing;
    }

    const newMem: AIMemory = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userId,
      key: key.trim(),
      fact: fact.trim(),
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    memoriesCache.push(newMem);
    atomicWriteFile(MEMORIES_FILE, memoriesCache);
    return newMem;
  },

  deleteMemory(userId: string, memoryId: string): boolean {
    const initialLen = memoriesCache.length;
    memoriesCache = memoriesCache.filter((m) => !(m.id === memoryId && m.userId === userId));
    if (memoriesCache.length !== initialLen) {
      atomicWriteFile(MEMORIES_FILE, memoriesCache);
      return true;
    }
    return false;
  },
};

// Smart Concise Title Generator (Requirement 12)
export function generateConciseTitle(text: string): string {
  if (!text) return 'New Chat';
  
  let cleaned = text
    .replace(/^[\s\d.,!?;:()[\]"'_#*-]+/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .trim();

  // Strip conversational filler prefixes in Hindi & English
  const prefixes = [
    /^(please\s+tell\s+me|can\s+you\s+explain|how\s+to|what\s+is|who\s+is|tell\s+me\s+about|write\s+a|create\s+a)\s+/iu,
    /^(कृपया\s+|भाई\s+|मुझे\s+|जरा\s+|प्लीज\s+)?(बताओ|समझाओ|लिखो|बनाओ|सिखाओ|दिखाओ)\s*(कि)?\s*/iu,
    /^(kripya|bhai|mujhe|please)\s+/iu,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  // Strip conversational suffixes: "बताओ", "समझाओ", "लिखो", "प्लीज", "batao", etc.
  cleaned = cleaned
    .replace(/\s+(बताओ|समझाओ|लिखकर दो|लिखो|प्लीज|बताइए|सिखाओ|दिखाओ|batao|bataiye|explain|karo|bata do)[?!।.\s]*$/iu, '')
    .trim();

  // Truncate cleanly at word boundary up to ~36 characters
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
