import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { EdgeTTS } from 'node-edge-tts';
import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import os from 'os';
import path from 'path';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
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

function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pathname = (req.query.path as string) || req.url || '';
  const isHealth = pathname.includes('health');
  const isChat = pathname.includes('chat');
  const isImagine = pathname.includes('imagine');
  const isTTS = pathname.includes('tts');

  if (isHealth || req.method === 'GET' && !isChat && !isImagine && !isTTS) {
    return res.status(200).json({
      status: 'ok',
      name: 'HK Samrat AI',
      version: '3.0.0',
      capabilities: ['fast_turbo', 'deep_reasoning', 'google_search_grounding', 'multimodal_vision', 'live_code_canvas', 'imagine_studio'],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const ai = getGenAI();

    if (isChat) {
      const {
        messages = [],
        systemPrompt = '',
        mode = 'turbo',
        enableSearch = false,
        imageData = null,
      } = req.body || {};

      let modelName = 'gemini-2.5-flash';
      let thinkingConfig: any = undefined;
      let tools: any[] = [];

      if (mode === 'reasoning') {
        modelName = 'gemini-2.5-pro';
        thinkingConfig = { thinkingBudget: 4096 };
      } else if (mode === 'turbo') {
        modelName = 'gemini-2.5-flash';
        thinkingConfig = { thinkingBudget: 0 };
      }

      if (enableSearch) {
        tools.push({ googleSearch: {} });
      }

      const contents: any[] = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;
        const parts: any[] = [];

        if (isLast && imageData && imageData.data) {
          parts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType || 'image/jpeg',
            },
          });
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts,
          });
        }
      }

      if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      const defaultSystem = `You are "HK Samrat AI", a world-class, ultra-intelligent, friendly AI created by Hariom Kushwaha.
You speak fluently in Hindi, Hinglish, and English with deep knowledge, warmth, and precision.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt || defaultSystem,
          ...(thinkingConfig ? { thinkingConfig } : {}),
          ...(tools.length > 0 ? { tools } : {}),
        },
      });

      const text = response.text || '';
      let thoughts = '';
      let searchGrounding = null;

      try {
        const candidate = response.candidates?.[0];
        if (candidate?.groundingMetadata?.groundingChunks) {
          searchGrounding = candidate.groundingMetadata.groundingChunks;
        }
      } catch {}

      return res.status(200).json({
        reply: text,
        thoughts: thoughts || undefined,
        searchGrounding,
        modelUsed: modelName,
      });
    }

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
      } catch (imgErr: any) {
        // Fallback to Pollinations image generation
        const encoded = encodeURIComponent(enhancedPrompt);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
        return res.status(200).json({
          imageUrl: fallbackUrl,
          prompt: enhancedPrompt,
          isFallback: true,
        });
      }
    }

    if (isTTS) {
      const { text, lang = 'hi-IN', voice = 'hi-IN-MadhurNeural' } = req.body || {};
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const cleanText = text.replace(/[*_#`~[\]()<>]/g, ' ').substring(0, 400);

      // Edge TTS Tier
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
        // Google TTS Tier
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
