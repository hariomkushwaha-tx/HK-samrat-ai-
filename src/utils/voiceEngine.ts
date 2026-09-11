// HK Samrat AI Advanced Voice & Speech Synthesis Engine
// Built for high-clarity Hindi, Hinglish, and English natural voice synthesis

export type VoicePersonaId =
  | 'aaradhya'
  | 'arjun'
  | 'priya'
  | 'rohan'
  | 'serena'
  | 'alex'
  | 'auto';

export interface VoicePersona {
  id: VoicePersonaId;
  name: string;
  nativeName: string;
  gender: 'female' | 'male' | 'adaptive';
  language: string;
  description: string;
  tag: string;
  defaultPitch: number;
  defaultRate: number;
  previewSampleText: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'aaradhya',
    name: 'Aaradhya (Sweet Hindi)',
    nativeName: 'आराध्या (मधुर एवं प्राकृतिक हिंदी)',
    gender: 'female',
    language: 'hi-IN',
    description: 'मिठास भरी, स्पष्ट और स्वाभाविक हिंदी आवाज़ जो बिल्कुल इंसानी अंदाज़ में बोलती है।',
    tag: 'RECOMMENDED FOR HINDI',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSampleText: 'नमस्ते! मैं एचके सम्राट एआई हूँ। मैं आपकी किस प्रकार सहायता कर सकती हूँ?',
  },
  {
    id: 'arjun',
    name: 'Arjun (Deep Hindi)',
    nativeName: 'अर्जुन (गंभीर व स्पष्ट हिंदी स्वर)',
    gender: 'male',
    language: 'hi-IN',
    description: 'गहरा, आत्मविश्वासी और स्पष्ट हिंदी पुरुष स्वर जो तकनीकी और विश्लेषणात्मक जवाबों के लिए उपयुक्त है।',
    tag: 'POWERFUL HINDI',
    defaultPitch: 1.0,
    defaultRate: 0.98,
    previewSampleText: 'नमस्कार! मैं एचके सम्राट एआई हूँ। आपके हर सवाल का सटीक और विस्तृत समाधान तैयार है।',
  },
  {
    id: 'priya',
    name: 'Priya (Indian English)',
    nativeName: 'प्रिया (इंडियन इंग्लिश)',
    gender: 'female',
    language: 'en-IN',
    description: 'Natural Indian English accent, smooth, polite, articulate, and expressive.',
    tag: 'INDIAN ENGLISH',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSampleText: 'Hello! I am HK Samrat AI, ready to help you with code, research, and creative workflows.',
  },
  {
    id: 'rohan',
    name: 'Rohan (Indian Tech Male)',
    nativeName: 'रोहन (इंडियन टेक वॉइस)',
    gender: 'male',
    language: 'en-IN',
    description: 'Crisp, energetic, modern Indian English tech specialist voice.',
    tag: 'TECH FOCUSED',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSampleText: 'Hey there! HK Samrat AI is initialized and ready to build something great together.',
  },
  {
    id: 'serena',
    name: 'Serena (Studio Neural Female)',
    nativeName: 'सेरेना (क्रिस्टल स्टूडियो फीमेल)',
    gender: 'female',
    language: 'en-US',
    description: 'Crystal-clear global neural studio voice, perfect for storytelling and learning.',
    tag: 'STUDIO HD',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSampleText: 'Welcome to HK Samrat AI. How can I illuminate your ideas today?',
  },
  {
    id: 'alex',
    name: 'Alex (Executive Global Male)',
    nativeName: 'एलेक्स (ग्लोबल एग्जीक्यूटिव मेल)',
    gender: 'male',
    language: 'en-US',
    description: 'Resonant, crisp, executive studio tone for professional workflows.',
    tag: 'EXECUTIVE HD',
    defaultPitch: 1.0,
    defaultRate: 0.98,
    previewSampleText: 'Greetings. HK Samrat AI is running at peak intelligence and ready for your commands.',
  },
  {
    id: 'auto',
    name: 'Smart Auto Match',
    nativeName: 'स्मार्ट ऑटो मैच (स्वचालित भाषा पहचान)',
    gender: 'adaptive',
    language: 'auto',
    description: 'स्वचालित रूप से भाषा पहचान कर सर्वोत्तम प्राकृतिक आवाज़ का चयन करता है।',
    tag: 'AUTO PILOT',
    defaultPitch: 1.0,
    defaultRate: 1.0,
    previewSampleText: 'नमस्ते! HK Samrat AI automatically adapts voice according to your language.',
  },
];

// Helper: Check if string has Hindi / Devanagari script
export function isHindiText(text: string): boolean {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(text);
}

// Map of common acronyms & tech terms to natural Hindi phonetic pronunciations
const HINDI_PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  [/\bAI\b/gi, 'एआई'],
  [/\bA\.I\.\b/gi, 'एआई'],
  [/\bAPI\b/gi, 'एपीआई'],
  [/\bAPIs\b/gi, 'एपीआई'],
  [/\bUI\b/gi, 'यूआई'],
  [/\bUX\b/gi, 'यूएक्स'],
  [/\bURL\b/gi, 'वेब लिंक'],
  [/\bURLs\b/gi, 'वेब लिंक्स'],
  [/\bPDF\b/gi, 'पीडीएफ'],
  [/\bTTS\b/gi, 'टीटीएस'],
  [/\bHK\b/gi, 'एचके'],
  [/\bHTML\b/gi, 'एचटीएमएल'],
  [/\bCSS\b/gi, 'सीएसएस'],
  [/\bJS\b/gi, 'जावास्क्रिप्ट'],
  [/\bTS\b/gi, 'टाइपस्क्रिप्ट'],
  [/\bSQL\b/gi, 'सीक्वल'],
  [/\bDB\b/gi, 'डेटाबेस'],
  [/\bID\b/gi, 'आईडी'],
  [/\bIDs\b/gi, 'आईडी'],
  [/\bOK\b/gi, 'ओके'],
  [/\bApp\b/gi, 'ऐप'],
  [/\bApps\b/gi, 'ऐप्स'],
  [/\bBug\b/gi, 'बग'],
  [/\bBugs\b/gi, 'बग्स'],
  [/\bCode\b/gi, 'कोड'],
  [/\bLink\b/gi, 'लिंक'],
  [/\bChat\b/gi, 'चैट'],
  [/\bFile\b/gi, 'फ़ाइल'],
  [/\bFiles\b/gi, 'फ़ाइलें'],
  [/\bSettings\b/gi, 'सेटिंग्स'],
  [/\bAccount\b/gi, 'अकाउंट'],
  [/\bUser\b/gi, 'यूज़र'],
  [/\bPrompt\b/gi, 'प्रॉम्प्ट'],
  [/\bServer\b/gi, 'सर्वर'],
  [/\bFeatures?\b/gi, 'फीचर्स'],
  [/\bUpdate\b/gi, 'अपडेट'],
  [/\bSmart\b/gi, 'स्मार्ट'],
];

// Strip 100% of emojis, pictographs, symbols, flags, variation selectors, and modifiers
export function stripAllEmojis(text: string): string {
  if (!text) return '';
  return text
    // Comprehensive Unicode Extended Pictographic property (covers smileys, objects, people, animals, symbols)
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Unicode Emoji property
    .replace(/\p{Emoji_Presentation}/gu, '')
    // Regional Indicator symbols (country flags e.g. India, US)
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    // All Supplementary Symbols, Pictographs, Emoticons, Transport, Weather, Activities, Objects
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    // Miscellaneous symbols, Dingbats, Geometric shapes, Arrows
    .replace(/[\u{2300}-\u{27BF}]/gu, '')
    .replace(/[\u{2B50}-\u{2B55}]/gu, '')
    // Variation selectors (VS15, VS16) and Zero-Width Joiner (ZWJ) that cause TTS voices to pronounce emoji names
    .replace(/[\uFE0E\uFE0F\u200D\u200B\u200C]/gu, '')
    // Replace excessive spaces with single space
    .replace(/[ \t]+/g, ' ');
}

// Clean markdown, code blocks, raw URLs and excessive punctuation for natural speech
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  const hasHindi = isHindiText(text);

  let cleaned = text
    // Remove thought process blocks if any
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    // Remove ALL emojis and pictographic symbols so speech engines never speak emoji descriptions
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2300}-\u{27BF}]/gu, '')
    .replace(/[\u{2B50}-\u{2B55}]/gu, '')
    .replace(/[\uFE0E\uFE0F\u200D\u200B\u200C]/gu, '')
    // Replace code blocks with natural audio pauses
    .replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, () => {
      return hasHindi ? '। यहाँ कोड स्निपेट दिया गया है। ' : '. Here is the code snippet. ';
    })
    // Inline code `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove image tags or markdown images ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Replace markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw http/https links
    .replace(/https?:\/\/\S+/g, hasHindi ? 'वेबसाइट लिंक' : 'web link')
    // Remove table borders and separators
    .replace(/\|[-:\s|]+\|/g, ' ')
    .replace(/\|/g, ', ')
    // Remove markdown symbols (headers, bold, italics, quotes, list markers)
    .replace(/[*#_~>]/g, ' ')
    // Replace bullet points with comma pauses
    .replace(/^\s*[-•+*]\s+/gm, ', ')
    // Replace numbered lists like 1. 2. with pause
    .replace(/^\s*\d+\.\s+/gm, ', ')
    // Normalize punctuation
    .replace(/[;:]/g, ', ')
    .replace(/!+/g, '.')
    .replace(/\?+/g, '?')
    .replace(/\.{2,}/g, '.');

  // If text contains Hindi, apply phonetic smoothing for tech terms
  if (hasHindi) {
    for (const [pattern, replacement] of HINDI_PHONETIC_REPLACEMENTS) {
      cleaned = cleaned.replace(pattern, replacement);
    }
  }

  // Clean excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

// Split clean text into natural speech chunks (avoids browser speech freeze & enables natural breathing pauses)
export function chunkTextForSpeech(text: string): string[] {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return [];

  // Match sentences or natural phrase boundaries
  const rawChunks = cleaned.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [cleaned];
  const results: string[] = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    // If chunk is too long (> 140 chars), break it at commas or semicolons
    if (trimmed.length > 140) {
      const subParts = trimmed.split(/([,;:\-–—]+)/);
      let current = '';
      for (const part of subParts) {
        if ((current + part).length > 120) {
          if (current.trim()) results.push(current.trim());
          current = part;
        } else {
          current += part;
        }
      }
      if (current.trim()) results.push(current.trim());
    } else {
      results.push(trimmed);
    }
  }

  return results.length > 0 ? results : [cleaned];
}

// Intelligent voice resolution from browser synthesis pool
export function resolveBestVoice(
  personaId: VoicePersonaId,
  availableVoices: SpeechSynthesisVoice[],
  textSample?: string
): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number; lang: string } {
  const isHindi = textSample ? isHindiText(textSample) : personaId === 'aaradhya' || personaId === 'arjun';

  if (!availableVoices || availableVoices.length === 0) {
    return {
      voice: null,
      pitch: 1.0,
      rate: 1.0,
      lang: isHindi ? 'hi-IN' : 'en-US',
    };
  }

  const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];

  // Specific Persona Selection Rules
  let targetPersonaId = personaId;
  if (personaId === 'auto') {
    targetPersonaId = isHindi ? 'aaradhya' : 'serena';
  }

  let matchedVoice: SpeechSynthesisVoice | null = null;
  let targetLang = isHindi ? 'hi-IN' : 'en-US';

  // Lowercase search helper
  const matches = (v: SpeechSynthesisVoice, keywords: string[]) => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    return keywords.some((k) => name.includes(k) || lang.includes(k));
  };

  if (targetPersonaId === 'aaradhya') {
    targetLang = 'hi-IN';
    // 1. Natural / Online / Google Hindi voices
    matchedVoice =
      availableVoices.find((v) => matches(v, ['swara', 'swara online', 'natural']) && matches(v, ['hi', 'hindi', 'in'])) ||
      availableVoices.find((v) => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && matches(v, ['google', 'हिन्दी', 'female', 'lekha', 'kalpana'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('हिन्दी') || v.name.toLowerCase().includes('hindi')) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in') && matches(v, ['natural', 'female', 'neerja', 'veena'])) ||
      null;
  } else if (targetPersonaId === 'arjun') {
    targetLang = 'hi-IN';
    // 1. Natural / Online / Google Hindi Male voices
    matchedVoice =
      availableVoices.find((v) => matches(v, ['madhur', 'madhur online', 'natural']) && matches(v, ['hi', 'hindi', 'in'])) ||
      availableVoices.find((v) => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && matches(v, ['male', 'hemant', 'google'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('हिन्दी') || v.name.toLowerCase().includes('hindi')) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in') && matches(v, ['male', 'prabhat', 'ravi'])) ||
      null;
  } else if (targetPersonaId === 'priya') {
    targetLang = 'en-IN';
    matchedVoice =
      availableVoices.find((v) => matches(v, ['neerja', 'natural']) && matches(v, ['en-in', 'india'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in') && matches(v, ['female', 'veena', 'kavya'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in')) ||
      availableVoices.find((v) => matches(v, ['google uk english female', 'samantha'])) ||
      null;
  } else if (targetPersonaId === 'rohan') {
    targetLang = 'en-IN';
    matchedVoice =
      availableVoices.find((v) => matches(v, ['prabhat', 'natural']) && matches(v, ['en-in', 'india'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in') && matches(v, ['male', 'ravi'])) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in')) ||
      availableVoices.find((v) => matches(v, ['daniel', 'alex', 'guy'])) ||
      null;
  } else if (targetPersonaId === 'serena') {
    targetLang = 'en-US';
    matchedVoice =
      availableVoices.find((v) => matches(v, ['natural', 'neural']) && matches(v, ['jenny', 'aria', 'female'])) ||
      availableVoices.find((v) => matches(v, ['google us english', 'google uk english female', 'samantha', 'victoria'])) ||
      availableVoices.find((v) => v.lang.startsWith('en') && matches(v, ['female'])) ||
      availableVoices.find((v) => v.lang.startsWith('en')) ||
      null;
  } else if (targetPersonaId === 'alex') {
    targetLang = 'en-US';
    matchedVoice =
      availableVoices.find((v) => matches(v, ['natural', 'neural']) && matches(v, ['guy', 'ryan', 'male'])) ||
      availableVoices.find((v) => matches(v, ['daniel', 'alex', 'google us english'])) ||
      availableVoices.find((v) => v.lang.startsWith('en') && matches(v, ['male'])) ||
      availableVoices.find((v) => v.lang.startsWith('en')) ||
      null;
  }

  // Fallback: If Hindi text was detected, strictly try to pick a Hindi voice first
  if (!matchedVoice && isHindi) {
    matchedVoice =
      availableVoices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes('en-in')) ||
      null;
  }

  if (!matchedVoice) {
    matchedVoice = availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0] || null;
  }

  // If a voice is selected, inherit its exact language tag
  if (matchedVoice && matchedVoice.lang) {
    targetLang = matchedVoice.lang;
  }

  return {
    voice: matchedVoice,
    pitch: 1.0, // Human calibrated baseline (1.0 produces zero metallic / robotic artifact)
    rate: 1.0,
    lang: targetLang,
  };
}

// Futuristic Soft Sound Effects using Web Audio API (zero external assets needed)
class AudioChimeSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play pleasant subtle chime
  play(type: 'send' | 'receive' | 'voice_start' | 'voice_stop' | 'click') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'receive') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(784, now + 0.18);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'voice_start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'voice_stop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // AudioContext muted/unsupported
    }
  }
}

export const chimeSynthesizer = new AudioChimeSynthesizer();
