import { AppSettings, ChatMessage, GroundingSource } from '../types';

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
        'Content-Type': 'application/json',
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

