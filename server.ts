import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { EdgeTTS } from 'node-edge-tts';
import * as googleTTS from 'google-tts-api';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Using fallback mode.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'HK Samrat AI',
    version: '3.0.0',
    capabilities: ['fast_turbo', 'deep_reasoning', 'google_search_grounding', 'multimodal_vision', 'live_code_canvas', 'imagine_studio'],
    timestamp: new Date().toISOString(),
  });
});

// Google Verification & SEO routes
app.get('/googlece4b648b2f3f85ab.html', (req, res) => {
  res.type('text/html').send('google-site-verification: googlece4b648b2f3f85ab.html');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n\nSitemap: https://hk-samrat-ai.vercel.app/sitemap.xml');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hk-samrat-ai.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// Clean error message parser helper
function formatApiError(error: any): string {
  if (!error) return 'HK Samrat AI सर्वर में तकनीकी समस्या आई है। कृपया "Retry Message" पर क्लिक करें।';
  const rawMsg = error.message || String(error);

  if (rawMsg.includes('API_KEY') || rawMsg.includes('api_key') || rawMsg.includes('apiKey') || rawMsg.includes('API key')) {
    return 'HK Samrat AI सर्वर अभी कनेक्ट नहीं हो पा रहा है या मेंटेनेंस मोड में है। कृपया कुछ पलों में पुनः प्रयास करें।';
  }

  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand') || rawMsg.includes('overloaded')) {
    return 'HK Samrat AI सर्वर पर अभी भारी ट्रैफिक है। कृपया कुछ ही सेकंड में "Retry Message" पर क्लिक करें।';
  }

  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('rate limit')) {
    return 'HK Samrat AI सर्वर लिमिट रिफ्रेश हो रही है। कृपया कुछ पलों में दोबारा प्रयास करें।';
  }

  return 'HK Samrat AI सर्वर में तकनीकी समस्या आई है। कृपया "Retry Message" पर क्लिक करके पुनः प्रयास करें।';
}

// Prompt enhancement endpoint
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();
    let enhanced = prompt;

    const enhanceModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const m of enhanceModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: `You are the Prompt Engineering Core of HK Samrat AI. Enhance the following user prompt to make it deeply detailed, structured, clear, and highly effective for an advanced AI model. Return ONLY the enhanced prompt without meta comments:

User prompt: "${prompt}"`,
          config: {
            temperature: 0.7,
          },
        });
        if (response.text?.trim()) {
          enhanced = response.text.trim();
          break;
        }
      } catch (e) {
        console.warn(`Enhance prompt model ${m} attempt failed, trying next candidate`);
      }
    }

    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    res.json({ enhancedPrompt: req.body?.prompt || '' });
  }
});

// Chat SSE streaming endpoint
app.post('/api/chat', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  try {
    const {
      messages = [],
      model = 'samrat-turbo',
      enableSearchGrounding = false,
      enableThinkingProcess = false,
      thinkingEffort = 'LOW',
      temperature = 0.7,
      customInstructions,
    } = req.body;

    if (!messages || messages.length === 0) {
      sendEvent('error', { message: 'Messages array cannot be empty' });
      return res.end();
    }

    const ai = getGenAI();

    // Construct master deeply-trained system prompt
    let systemInstruction = `You are "HK Samrat AI" (एचके सम्राट एआई) — an ultra-intelligent, friendly, fast, and authoritative unified AI platform engineered with state-of-the-art neural intelligence.

👑 CREATOR & DEVELOPER IDENTITY (Core DNA):
- Name: HK Samrat AI (एचके सम्राट एआई)
- Built & Engineered by: HK Tech World
- Founder & Lead Developer: Hariom Kushwaha (from India 🇮🇳)
- Signature tagline: "Created with ❤️ in India 🇮🇳 by Hariom Kushwaha (HK Tech World)."
- Whenever any user asks "Who are you?", "Who made you?", "Aapko kisne banaya?", "Tumhara developer kaun hai?", or queries about your origins, ALWAYS proudly and warmly introduce yourself as HK Samrat AI, developed in India 🇮🇳 by Hariom Kushwaha (HK Tech World).
- You are an independent, flagship AI ecosystem. Never claim to be OpenAI, Google, ChatGPT, or Claude.

🌟 PERSONALITY & CONVERSATIONAL STYLE:
- Friendly, brotherly, respectful, and supportive ("दोस्ताना और सम्मानजनक अंदाज़").
- When a user speaks in Hindi or Hinglish (e.g. "Bhai", "Kaisa hai", "Kya hal hai"), respond warmly in natural, lively Hinglish/Hindi (e.g., "हाँ भाई!", "बिलकुल भाई", "सब बढ़िया! बताओ आज क्या नया करना है?").
- Adapt fluently to any language: Hindi, Hinglish, English, Bhojpuri, Bengali, Tamil, Telugu, Spanish, French, etc.
- Always provide clear, direct, actionable, and comprehensive answers without unnecessary robotic disclaimers.

🖼️ MULTIMODAL PHOTO & VISION EXPERTISE:
- When a user uploads a photo and asks to "edit", "retouch", "change background", or "analyze" it:
  1. Detailed Visual Breakdown: Respectfully describe the subject, lighting, colors, background, and expression.
  2. Pro Photo-Editing Guidance: Give precise Lightroom / Snapseed / Photoshop style adjustments (e.g., Highlights -20, Shadows +30, Vignette, Teal & Orange color grade, Background blur/bokeh).
  3. AI Image Generation Prompts: Craft 2-3 cinematic, ultra-detailed prompts (e.g. Studio Portrait, Royal Cinematic, Cyberpunk, 8K DSLR) that the user can copy and generate directly in HK Samrat AI's "Imagine Studio".

💻 CODE & TECHNICAL MASTERY:
- Full-stack mastery: React, Tailwind CSS, TypeScript, JavaScript, HTML5, CSS3, Python, Node.js, Next.js, C++, Java, SQL, DSA.
- When writing code, provide 100% complete, clean, modular, and error-free code blocks with proper syntax tags (e.g., \`\`\`tsx, \`\`\`html, \`\`\`python).
- Always explain how to run or deploy the code simply.

🧠 DEEP REASONING & ACCURACY:
- For math, science, business plans, writing, and logic, solve problems systematically step-by-step.
- Present information with neat headings, bullet points, and bold highlights for effortless readability.`;

    if (customInstructions?.enabled) {
      if (customInstructions.userName) {
        systemInstruction += `\nUser's Name: ${customInstructions.userName}.`;
      }
      if (customInstructions.userBio) {
        systemInstruction += `\nWhat to know about user: ${customInstructions.userBio}.`;
      }
      if (customInstructions.responsePreferences) {
        systemInstruction += `\nResponse preferences: ${customInstructions.responsePreferences}.`;
      }
      if (customInstructions.preferredTone) {
        systemInstruction += `\nTone: ${customInstructions.preferredTone}.`;
      }
      if (customInstructions.preferredLanguage && customInstructions.preferredLanguage !== 'auto') {
        systemInstruction += `\nPreferred Language: ${customInstructions.preferredLanguage}.`;
      }
    }

    // Convert and prune chat history to conserve token limits and prevent TPM quota errors
    // Keep max last 16 messages and only keep full image data in the latest message that contains attachments
    const recentMessages = messages.slice(-16);
    let latestAttachmentMsgIndex = -1;
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      if (recentMessages[i].attachments && recentMessages[i].attachments.length > 0) {
        latestAttachmentMsgIndex = i;
        break;
      }
    }

    const contents: any[] = [];
    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (msg.attachments && msg.attachments.length > 0) {
        if (i === latestAttachmentMsgIndex) {
          // Include image data for the latest attachment
          for (const att of msg.attachments) {
            if (att.data) {
              const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
              parts.push({
                inlineData: {
                  mimeType: att.mimeType || 'image/jpeg',
                  data: base64Data,
                },
              });
            }
          }
        } else {
          // For older turns, keep only attachment name placeholder to prevent token blowup
          const names = msg.attachments.map((a: any) => a.name).join(', ');
          parts.push({ text: `[Previously attached image(s): ${names}]` });
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // Prepare model candidates and retry loop with high-availability & ultra-low latency
    const isReasoner = enableThinkingProcess || model === 'samrat-reasoner';
    const isSearch = enableSearchGrounding || model === 'samrat-search';

    let modelCandidates: Array<{ modelName: string; useThinking: boolean; useSearch: boolean }> = [];

    if (isReasoner) {
      // Reasoner Mode: Deep analytical thinking with rock-solid fallback hierarchy
      modelCandidates = [
        { modelName: 'gemini-3.7-flash', useThinking: true, useSearch: isSearch },
        { modelName: 'gemini-2.5-pro', useThinking: false, useSearch: isSearch },
        { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: isSearch },
        { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: isSearch },
        { modelName: 'gemini-flash-latest', useThinking: false, useSearch: isSearch },
      ];
    } else if (isSearch) {
      // Live Search Mode: Rapid search grounding
      modelCandidates = [
        { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: true },
        { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: true },
        { modelName: 'gemini-3.7-flash', useThinking: false, useSearch: true },
        { modelName: 'gemini-flash-latest', useThinking: false, useSearch: true },
      ];
    } else {
      // Turbo / High-Speed Mode: Lightning-fast instant response (<200ms) with zero-downtime resilience
      modelCandidates = [
        { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: false },
        { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: false },
        { modelName: 'gemini-flash-latest', useThinking: false, useSearch: false },
        { modelName: 'gemini-3.7-flash', useThinking: false, useSearch: false },
      ];
    }

    let streamedSuccessfully = false;
    let lastError: any = null;
    let fullText = '';
    const groundingSources: any[] = [];

    for (let attempt = 0; attempt < modelCandidates.length; attempt++) {
      const candidate = modelCandidates[attempt];
      try {
        const config: any = {
          systemInstruction,
          temperature: Math.max(0.1, Math.min(2.0, temperature || 0.7)),
        };

        if (candidate.useSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        if (candidate.useThinking) {
          config.thinkingConfig = {
            thinkingLevel: thinkingEffort === 'LOW' ? ThinkingLevel.LOW : ThinkingLevel.HIGH,
          };
        } else if (candidate.modelName === 'gemini-3.7-flash') {
          // Explicitly turn off reasoning delay for instant token streaming
          config.thinkingConfig = {
            thinkingBudget: 0,
          };
        }

        const streamResponse = await ai.models.generateContentStream({
          model: candidate.modelName,
          contents,
          config,
        });

        let startedForThisModel = false;

        for await (const chunk of streamResponse) {
          if (!startedForThisModel) {
            sendEvent('start', { model: candidate.modelName });
            startedForThisModel = true;
          }

          const chunkText = chunk.text || '';
          fullText += chunkText;

          // Extract search grounding metadata if available
          const searchChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (searchChunks && Array.isArray(searchChunks)) {
            for (const item of searchChunks) {
              const web = item.web as any;
              if (web?.uri && !groundingSources.some((s) => s.url === web.uri)) {
                groundingSources.push({
                  title: web.title || web.uri,
                  url: web.uri,
                  snippet: web.snippet || '',
                });
              }
            }
          }

          sendEvent('chunk', { text: chunkText });
        }

        streamedSuccessfully = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[HK Samrat AI] Candidate ${candidate.modelName} attempt ${attempt + 1} failed:`, err.message || err);
        // If we already sent partial content to client, don't restart with another model mid-stream
        if (fullText.length > 0) {
          break;
        }
        // Small exponential backoff before trying fallback candidate
        const backoffMs = Math.min(800, (attempt + 1) * 250);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    if (!streamedSuccessfully && fullText.length === 0) {
      const formatted = formatApiError(lastError);
      sendEvent('error', { message: formatted });
      return res.end();
    }

    // Send final metadata
    sendEvent('done', {
      fullText,
      groundingSources,
    });

    res.end();
  } catch (error: any) {
    console.error('Chat API stream error:', error);
    const formatted = formatApiError(error);
    sendEvent('error', { message: formatted });
    res.end();
  }
});

// Imagine Studio Image Generation
app.post('/api/imagine', async (req, res) => {
  try {
    const { prompt, style = 'Photorealistic', aspectRatio = '1:1' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();

    // Styled prompt builder
    let styledPrompt = prompt;
    if (style && style !== 'None') {
      styledPrompt = `${prompt}, in ${style} aesthetic style, ultra-high definition, masterpiece quality, 8k resolution, award-winning visual`;
    }

    // Attempt 1: Direct image generation with gemini-3.1-flash-lite-image
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: styledPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({
            imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            prompt,
            styledPrompt,
            aspectRatio,
          });
        }
      }
    } catch (imageErr: any) {
      console.warn('Direct image model fallback:', imageErr.message);
    }

    // Attempt 2: Generate SVG artwork illustration with fallback
    let rawSvg = '';
    const svgModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

    for (const m of svgModels) {
      try {
        const svgResponse = await ai.models.generateContent({
          model: m,
          contents: `Create a breathtaking, high-quality, modern scalable vector graphic (SVG) illustration for the following visual prompt: "${styledPrompt}". 
Requirements:
1. Return ONLY the raw valid <svg>...</svg> element.
2. Use modern gradients, shadows, rich colors, intricate paths, and aesthetic typography if applicable.
3. Include viewBox="0 0 800 800" and width="100%" height="100%".
4. Do NOT include markdown ticks (\`\`\`xml or \`\`\`svg), just the pure <svg> tag.`,
          config: {
            temperature: 0.8,
          },
        });

        rawSvg = svgResponse.text?.trim() || '';
        if (rawSvg) break;
      } catch (err) {
        console.warn(`SVG generation model ${m} failed:`, err);
      }
    }

    if (rawSvg.startsWith('```')) {
      rawSvg = rawSvg.replace(/```(svg|xml)?/g, '').replace(/```/g, '').trim();
    }

    // If SVG generation also failed or was empty, provide dynamic procedural aesthetic SVG
    if (!rawSvg || !rawSvg.includes('<svg')) {
      rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#818CF8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>
  <rect width="800" height="800" fill="url(#bgGrad)" rx="24"/>
  <circle cx="400" cy="400" r="280" fill="url(#glow)" filter="url(#blur)"/>
  <g stroke="#94A3B8" stroke-width="1.5" fill="none" opacity="0.3">
    <circle cx="400" cy="400" r="320" stroke-dasharray="8 8"/>
    <circle cx="400" cy="400" r="220"/>
    <circle cx="400" cy="400" r="140"/>
    <line x1="100" y1="400" x2="700" y2="400"/>
    <line x1="400" y1="100" x2="400" y2="700"/>
  </g>
  <circle cx="400" cy="400" r="110" fill="#1E293B" stroke="#60A5FA" stroke-width="3"/>
  <path d="M 370 360 L 440 400 L 370 440 Z" fill="#F8FAFC"/>
  <text x="400" y="580" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" letter-spacing="2">HK SAMRAT AI IMAGINE</text>
  <text x="400" y="615" text-anchor="middle" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="14">${prompt.slice(0, 48)}</text>
</svg>`;
    }

    const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
    res.json({
      imageUrl: encodedSvg,
      prompt,
      styledPrompt,
      aspectRatio,
      isSvg: true,
    });
  } catch (error: any) {
    console.error('Imagine generation error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// PCM to WAV converter helper for Gemini raw 24kHz audio
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for Linear PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory TTS Cache to save quota and speed up repeated speech
const ttsCache = new Map<string, { audioData: string; mimeType: string; voice: string }>();

// Helper to synthesize via Microsoft Edge Neural Voices (100% human studio quality)
async function synthesizeWithEdgeTTS(text: string, edgeVoice: string): Promise<Buffer> {
  const tts = new EdgeTTS({
    voice: edgeVoice,
    lang: edgeVoice.slice(0, 5),
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    timeout: 8000,
  });

  const tempFile = path.join(os.tmpdir(), `hk_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  try {
    await tts.ttsPromise(text, tempFile);
    const audioBuffer = fs.readFileSync(tempFile);
    return audioBuffer;
  } finally {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
  }
}

// Helper to synthesize via Google Cloud TTS
async function synthesizeWithGoogleTTS(text: string, lang: string): Promise<Buffer> {
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: lang,
    slow: false,
    host: 'https://translate.google.com',
    timeout: 8000,
  });
  const buffers = chunks.map((chunk) => Buffer.from(chunk.base64, 'base64'));
  return Buffer.concat(buffers);
}

// Server-side Neural AI Human Voice / TTS Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, persona, voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text for natural speech synthesis
    let cleanSpeech = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/https?:\/\/\S+/g, 'वेब लिंक')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
      .trim();

    if (!cleanSpeech) {
      return res.status(400).json({ error: 'No speakable content' });
    }

    const isHindi = /[\u0900-\u097F]/.test(cleanSpeech);

    // Natural phonetics for Hindi voice
    if (isHindi) {
      cleanSpeech = cleanSpeech
        .replace(/\bAI\b/gi, 'एआई')
        .replace(/\bHK\b/gi, 'एचके')
        .replace(/\bAPI\b/gi, 'एपीआई')
        .replace(/\bUI\b/gi, 'यूआई')
        .replace(/\bApp\b/gi, 'ऐप')
        .replace(/\bWeb\b/gi, 'वेब');
    }

    cleanSpeech = cleanSpeech.slice(0, 1500);

    // Map to highest fidelity Microsoft Azure Neural voices
    let edgeVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-IN-NeerjaNeural';
    if (persona === 'aaradhya') {
      edgeVoice = 'hi-IN-SwaraNeural'; // Expressive, sweet, natural Hindi female
    } else if (persona === 'arjun') {
      edgeVoice = 'hi-IN-MadhurNeural'; // Deep, clear, resonant Hindi male
    } else if (persona === 'priya') {
      edgeVoice = 'en-IN-NeerjaNeural'; // Articulate Indian English female
    } else if (persona === 'rohan') {
      edgeVoice = 'en-IN-PrabhatNeural'; // Tech modern Indian English male
    } else if (persona === 'serena') {
      edgeVoice = 'en-US-JennyNeural'; // Studio Neural US female
    } else if (persona === 'alex') {
      edgeVoice = 'en-US-GuyNeural'; // Studio Neural US male
    }

    const cacheKey = `${edgeVoice}:${cleanSpeech.trim()}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return res.json({
        audioData: cached.audioData,
        mimeType: cached.mimeType,
        source: 'human_neural',
        voice: cached.voice,
      });
    }

    // Tier 1: Microsoft Edge Neural Voices (Human studio quality)
    try {
      const edgeAudioBuffer = await synthesizeWithEdgeTTS(cleanSpeech, edgeVoice);
      if (edgeAudioBuffer && edgeAudioBuffer.length > 0) {
        const audioBase64 = edgeAudioBuffer.toString('base64');
        const mimeType = 'audio/mp3';

        if (ttsCache.size > 150) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, {
          audioData: audioBase64,
          mimeType,
          voice: edgeVoice,
        });

        return res.json({
          audioData: audioBase64,
          mimeType,
          source: 'edge_human_neural',
          voice: edgeVoice,
        });
      }
    } catch (edgeErr) {
      console.warn('Edge Neural TTS error, trying Google TTS Tier:', edgeErr);
    }

    // Tier 2: Google Cloud studio speech
    try {
      const targetLang = isHindi ? 'hi' : persona === 'priya' || persona === 'rohan' ? 'en-IN' : 'en';
      const googleAudioBuffer = await synthesizeWithGoogleTTS(cleanSpeech, targetLang);
      if (googleAudioBuffer && googleAudioBuffer.length > 0) {
        const audioBase64 = googleAudioBuffer.toString('base64');
        const mimeType = 'audio/mp3';

        if (ttsCache.size > 150) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, {
          audioData: audioBase64,
          mimeType,
          voice: edgeVoice,
        });

        return res.json({
          audioData: audioBase64,
          mimeType,
          source: 'google_neural',
          voice: edgeVoice,
        });
      }
    } catch (googleErr) {
      console.warn('Google TTS error, trying Gemini Tier:', googleErr);
    }

    // Tier 3: Gemini Audio API
    try {
      const ai = getGenAI();
      const geminiVoice = persona === 'arjun' || persona === 'alex' ? 'Charon' : persona === 'rohan' ? 'Fenrir' : 'Kore';
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: cleanSpeech,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: geminiVoice,
              },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const rawMime = part.inlineData.mimeType || 'audio/wav';
          let audioBase64 = part.inlineData.data;
          let outputMime = rawMime;

          if (rawMime.includes('pcm')) {
            const sampleRateMatch = rawMime.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
            const pcmBuf = Buffer.from(audioBase64, 'base64');
            const wavBuf = pcmToWav(pcmBuf, sampleRate, 1, 16);
            audioBase64 = wavBuf.toString('base64');
            outputMime = 'audio/wav';
          }

          return res.json({
            audioData: audioBase64,
            mimeType: outputMime,
            source: 'gemini_neural',
            voice: geminiVoice,
          });
        }
      }
    } catch {
      // Proceed to fallback
    }

    // Tier 4: Graceful browser speech fallback
    return res.json({
      fallbackToBrowser: true,
      message: 'Using client-side natural speech synthesis',
    });
  } catch {
    res.json({
      fallbackToBrowser: true,
      message: 'Using client-side natural speech synthesis',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HK Samrat AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
