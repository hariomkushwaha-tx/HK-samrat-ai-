import { GoogleGenAI } from '@google/genai';
import { EdgeTTS } from 'node-edge-tts';
import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import os from 'os';
import path from 'path';

type VercelReq = any;
type VercelRes = any;

let aiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getGenAI(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY || '';
  if (!aiClient || cachedApiKey !== currentKey) {
    cachedApiKey = currentKey;
    aiClient = new GoogleGenAI({
      apiKey: currentKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlPath = (req.query?.path as string) || req.url || '';
  const isHealth = urlPath.includes('health');
  const isChat = urlPath.includes('chat') || req.method === 'POST';
  const isImagine = urlPath.includes('imagine');
  const isTTS = urlPath.includes('tts');
  const isEnhance = urlPath.includes('enhance-prompt');

  // Health check endpoint
  if (isHealth || (req.method === 'GET' && !urlPath.includes('chat') && !urlPath.includes('imagine') && !urlPath.includes('tts'))) {
    return res.status(200).json({
      status: 'ok',
      name: 'HK Samrat AI',
      version: '3.0.0',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      capabilities: ['fast_turbo', 'deep_reasoning', 'google_search_grounding', 'multimodal_vision', 'live_code_canvas', 'imagine_studio'],
      timestamp: new Date().toISOString(),
    });
  }

  // Multi-engine key detection (GEMINI_API_KEY, GROQ_API_KEY, or any variant)
  const findEnv = (match: string): string => {
    const matchUpper = match.toUpperCase();
    for (const [k, v] of Object.entries(process.env)) {
      if (v && k.toUpperCase().includes(matchUpper)) {
        return (v as string).trim();
      }
    }
    return '';
  };

  const geminiKey = process.env.GEMINI_API_KEY?.trim() || findEnv('GEMINI');
  const groqKey = process.env.GROQ_API_KEY?.trim() || findEnv('GROQ');

  if (!geminiKey && !groqKey) {
    if (urlPath.includes('chat') || isChat) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'HK Samrat AI सर्वर अभी व्यस्त है या तकनीकी मेंटेनेंस मोड में है। कृपया कुछ पलों बाद "Retry Message" पर क्लिक करें।' })}\n\n`);
      return res.end();
    }
    return res.status(503).json({
      error: 'HK Samrat AI Server is currently busy or undergoing scheduled maintenance. Please try again shortly.',
    });
  }

  try {
    const ai = geminiKey ? new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }) : null;

    // 1. Prompt Enhancement
    if (isEnhance && !isChat) {
      const { prompt } = req.body || {};
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      let enhanced = prompt;
      const enhanceModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'];
      for (const m of enhanceModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: `You are the Prompt Engineering Core of HK Samrat AI. Enhance the following user prompt to make it deeply detailed, structured, clear, and highly effective for an advanced AI model. Return ONLY the enhanced prompt without meta comments:\n\nUser prompt: "${prompt}"`,
            config: { temperature: 0.7 },
          });
          if (response.text?.trim()) {
            enhanced = response.text.trim();
            break;
          }
        } catch {
          // try next
        }
      }
      return res.status(200).json({ enhancedPrompt: enhanced });
    }

    // 2. Chat SSE Stream
    if (urlPath.includes('chat') || (req.method === 'POST' && !isImagine && !isTTS && !isEnhance)) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const sendEvent = (event: string, data: any) => {
        try {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          console.warn('Write stream chunk failed:', e);
        }
      };

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const {
        messages = [],
        model = 'samrat-turbo',
        enableSearchGrounding = false,
        enableThinkingProcess = false,
        temperature = 0.7,
        customInstructions,
      } = body;

      if (!messages || messages.length === 0) {
        sendEvent('error', { message: 'Messages array cannot be empty' });
        return res.end();
      }

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
- When a user speaks in Hindi or Hinglish (e.g. "Bhai", "Kaisa hai", "Kya hal hai", "Hi"), respond warmly in natural, lively Hinglish/Hindi (e.g., "नमस्ते भाई!", "हाँ भाई!", "सब बढ़िया! बताओ आज क्या नया करना है?").
- Adapt fluently to any language: Hindi, Hinglish, English, Bhojpuri, Bengali, Tamil, Telugu, etc.
- Always provide clear, direct, actionable, and comprehensive answers without unnecessary robotic disclaimers.

🖼️ MULTIMODAL PHOTO & VISION EXPERTISE:
- When a user uploads a photo and asks to "edit", "retouch", "change background", or "analyze" it:
  1. Detailed Visual Breakdown: Respectfully describe the subject, lighting, colors, background, and expression.
  2. Pro Photo-Editing Guidance: Give precise Lightroom / Snapseed / Photoshop style adjustments (e.g., Highlights -20, Shadows +30, Vignette, Teal & Orange color grade, Background blur/bokeh).
  3. AI Image Generation Prompts: Craft 2-3 cinematic, ultra-detailed prompts that the user can copy and generate directly in HK Samrat AI's "Imagine Studio".

💻 CODE & TECHNICAL MASTERY:
- Full-stack mastery: React, Tailwind CSS, TypeScript, JavaScript, HTML5, CSS3, Python, Node.js, Next.js, C++, Java, SQL, DSA.
- When writing code, provide 100% complete, clean, modular, and error-free code blocks with proper syntax tags.`;

      if (customInstructions?.enabled) {
        if (customInstructions.userName) systemInstruction += `\nUser's Name: ${customInstructions.userName}.`;
        if (customInstructions.userBio) systemInstruction += `\nWhat to know about user: ${customInstructions.userBio}.`;
        if (customInstructions.responsePreferences) systemInstruction += `\nResponse preferences: ${customInstructions.responsePreferences}.`;
        if (customInstructions.preferredTone) systemInstruction += `\nTone: ${customInstructions.preferredTone}.`;
        if (customInstructions.preferredLanguage && customInstructions.preferredLanguage !== 'auto') {
          systemInstruction += `\nPreferred Language: ${customInstructions.preferredLanguage}.`;
        }
      }

      // Convert messages
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

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: 'Hi' }] });
      }

      const isReasoner = enableThinkingProcess || model === 'samrat-reasoner';
      const isSearch = enableSearchGrounding || model === 'samrat-search';

      const modelCandidates = isReasoner
        ? [
            { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: isSearch },
            { modelName: 'gemini-3.7-flash', useThinking: true, useSearch: isSearch },
            { modelName: 'gemini-2.5-pro', useThinking: false, useSearch: isSearch },
            { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: isSearch },
            { modelName: 'gemini-flash-latest', useThinking: false, useSearch: isSearch },
          ]
        : isSearch
        ? [
            { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: true },
            { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: true },
            { modelName: 'gemini-3.7-flash', useThinking: false, useSearch: true },
            { modelName: 'gemini-flash-latest', useThinking: false, useSearch: true },
          ]
        : [
            { modelName: 'gemini-2.5-flash', useThinking: false, useSearch: false },
            { modelName: 'gemini-3.1-flash-lite', useThinking: false, useSearch: false },
            { modelName: 'gemini-flash-latest', useThinking: false, useSearch: false },
            { modelName: 'gemini-3.7-flash', useThinking: false, useSearch: false },
          ];

      let streamedSuccessfully = false;
      let lastError: any = null;
      let fullText = '';
      const groundingSources: any[] = [];

      if (ai) {
        for (const candidate of modelCandidates) {
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
                thinkingLevel: 'LOW',
              };
            }

            sendEvent('start', { model: candidate.modelName });

            const streamResult = await ai.models.generateContentStream({
              model: candidate.modelName,
              contents,
              config,
            });

            for await (const chunk of streamResult) {
              const chunkText = chunk.text || '';
              if (chunkText) {
                fullText += chunkText;
                sendEvent('chunk', { text: chunkText });
              }

              try {
                const cand = chunk.candidates?.[0];
                const searchChunks = cand?.groundingMetadata?.groundingChunks;
                if (searchChunks && Array.isArray(searchChunks)) {
                  for (const sc of searchChunks) {
                    if (sc.web?.uri && sc.web?.title) {
                      groundingSources.push({
                        title: sc.web.title,
                        url: sc.web.uri,
                        snippet: (sc.web as any)?.snippet || '',
                      });
                    }
                  }
                }
              } catch {}
            }

            sendEvent('done', {
              fullText,
              groundingSources: groundingSources.filter(
                (src, idx, arr) => arr.findIndex((x) => x.url === src.url) === idx
              ),
            });

            streamedSuccessfully = true;
            break;
          } catch (err: any) {
            lastError = err;
            console.warn(`Model candidate ${candidate.modelName} error on Vercel:`, err?.message);
          }
        }
      }

      // Seamless Groq fallback if Gemini was unavailable or encountered errors
      if (!streamedSuccessfully && groqKey) {
        try {
          sendEvent('start', { model: 'llama-3.3-70b-versatile' });

          const groqMessages = [
            { role: 'system', content: systemInstruction },
            ...recentMessages.map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content || '',
            })),
          ];

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: groqMessages,
              temperature: Math.max(0.1, Math.min(2.0, temperature || 0.7)),
              stream: true,
            }),
          });

          if (groqRes.ok && groqRes.body) {
            const reader = groqRes.body.getReader();
            const decoder = new TextDecoder();
            let doneReading = false;
            let groqFullText = '';

            while (!doneReading) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunkStr = decoder.decode(value, { stream: true });
              const lines = chunkStr.split('\n');

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    const textChunk = parsed.choices?.[0]?.delta?.content;
                    if (textChunk) {
                      streamedSuccessfully = true;
                      groqFullText += textChunk;
                      sendEvent('chunk', { text: textChunk });
                    }
                  } catch {}
                }
              }
            }

            if (streamedSuccessfully) {
              sendEvent('done', {
                fullText: groqFullText,
                groundingSources: [],
              });
            }
          }
        } catch (groqErr) {
          console.warn('Groq stream fallback error:', groqErr);
        }
      }

      if (!streamedSuccessfully) {
        sendEvent('error', {
          message: 'HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया "Retry Message" पर क्लिक करें।',
        });
      }

      return res.end();
    }

    // 3. Imagine Studio
    if (isImagine) {
      const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = req.body || {};
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const enhancedPrompt = `${prompt}, ${style} style, ultra high quality, 8k resolution, cinematic lighting, masterpiece`;

      try {
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: (aspectRatio as any) || '1:1',
            outputMimeType: 'image/jpeg',
          },
        });

        const image = response.generatedImages?.[0];
        if (image?.image?.imageBytes) {
          return res.status(200).json({
            imageUrl: `data:image/jpeg;base64,${image.image.imageBytes}`,
            prompt: enhancedPrompt,
          });
        }
      } catch {
        const encoded = encodeURIComponent(enhancedPrompt);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
        return res.status(200).json({
          imageUrl: fallbackUrl,
          prompt: enhancedPrompt,
          isFallback: true,
        });
      }
    }

    // 4. TTS Endpoint
    if (isTTS) {
      const { text, lang = 'hi-IN', voice = 'hi-IN-MadhurNeural' } = req.body || {};
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const cleanText = text.replace(/[*_#`~[\]()<>]/g, ' ').substring(0, 400);

      try {
        const tts = new EdgeTTS({ voice: voice || 'hi-IN-MadhurNeural' });
        const tmpFile = path.join(os.tmpdir(), `tts-${Date.now()}.mp3`);
        await tts.ttsPromise(cleanText, tmpFile);
        const audioBuffer = fs.readFileSync(tmpFile);
        fs.unlinkSync(tmpFile);

        return res.status(200).json({
          audioData: audioBuffer.toString('base64'),
          mimeType: 'audio/mp3',
          source: 'edge_neural',
        });
      } catch {
        try {
          const url = googleTTS.getAudioUrl(cleanText, {
            lang: lang.startsWith('hi') ? 'hi' : 'en',
            slow: false,
            host: 'https://translate.google.com',
          });
          return res.status(200).json({
            audioUrl: url,
            mimeType: 'audio/mp3',
            source: 'google_cloud_tts',
          });
        } catch {
          return res.status(200).json({
            fallbackToBrowser: true,
            message: 'Using client-side speech',
          });
        }
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
