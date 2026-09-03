import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Play,
  Pause,
  Square,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Zap,
  Globe,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { ChatMessage, GroundingSource } from '../types';
import { useAI } from '../context/AIContext';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const {
    regenerateMessage,
    openCanvas,
    speakText,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    isSpeaking,
    isSpeechPaused,
    speakingMessageId,
    isSpeechLoading,
    speechLoadingMessageId,
  } = useAI();

  const [copied, setCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';
  const isCurrentlySpeaking = isSpeaking && speakingMessageId === message.id;
  const isCurrentlyPaused = isSpeechPaused && speakingMessageId === message.id;
  const isCurrentlyLoadingSpeech = isSpeechLoading && speechLoadingMessageId === message.id;

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to extract thoughts if wrapped in <thought> tags
  const extractThoughtAndContent = (raw: string) => {
    const thoughtMatch = raw.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      const thought = thoughtMatch[1].trim();
      const content = raw.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim();
      return { thought, content };
    }
    return { thought: message.thoughtProcess || null, content: raw };
  };

  const { thought, content } = extractThoughtAndContent(message.content);

  // Custom Markdown components
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const lang = match ? match[1] : '';

      if (!inline && lang) {
        const canPreviewInCanvas = ['html', 'jsx', 'tsx', 'react', 'svg', 'js', 'javascript', 'css'].includes(
          lang.toLowerCase()
        );

        return (
          <div className="my-3 rounded-xl overflow-hidden border border-[#262626] bg-[#0A0A0A] shadow-sm font-mono">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#141414] border-b border-[#262626] text-[10px] text-[#888]">
              <span className="font-semibold text-blue-400 uppercase tracking-widest">{lang}</span>
              <div className="flex items-center gap-2">
                {canPreviewInCanvas && (
                  <button
                    onClick={() => {
                      let type: 'html' | 'react' | 'svg' | 'markdown' | 'javascript' | 'python' = 'html';
                      if (['jsx', 'tsx', 'react'].includes(lang.toLowerCase())) type = 'react';
                      else if (['svg'].includes(lang.toLowerCase())) type = 'svg';
                      else if (['js', 'javascript'].includes(lang.toLowerCase())) type = 'javascript';
                      openCanvas({
                        title: `${lang.toUpperCase()} Sandbox`,
                        type,
                        code: codeString,
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-blue-300 border border-[#333] transition-colors"
                    title="Open Live Preview in Canvas"
                  >
                    <Play className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />
                    <span>Run in Canvas</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopyCode(codeString, Math.random())}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedCodeIndex !== null ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-3.5 overflow-x-auto text-xs font-mono text-[#DDD] leading-relaxed custom-scrollbar bg-[#0E0E0E]">
              <pre>
                <code>{codeString}</code>
              </pre>
            </div>
          </div>
        );
      }

      return (
        <code className="px-1.5 py-0.5 rounded bg-[#1A1A1A] text-blue-300 font-mono text-xs border border-[#2B2B2B]" {...props}>
          {children}
        </code>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-3 overflow-x-auto rounded-lg border border-[#262626]">
          <table className="min-w-full divide-y divide-[#262626] text-xs text-left text-[#DDD]">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="px-3.5 py-2.5 bg-[#141414] text-[#AAA] font-mono font-semibold uppercase tracking-wider text-[10px]">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return <td className="px-3.5 py-2 border-t border-[#222]">{children}</td>;
    },
    a({ href, children }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 inline-flex items-center gap-0.5"
        >
          {children}
          <ExternalLink className="w-3 h-3 inline ml-0.5" />
        </a>
      );
    },
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-4 px-2 md:px-0 font-sans">
        <div className="max-w-[88%] md:max-w-[78%] flex flex-col items-end gap-1.5">
          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 justify-end">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl overflow-hidden border border-[#262626] bg-[#141414] shadow-md max-w-[200px]"
                >
                  {att.mimeType.startsWith('image/') && (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="max-h-40 object-cover rounded-xl"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User Message Bubble */}
          <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-[#1A1A1A] border border-[#333] text-[#F5F5F5] text-sm shadow-sm leading-relaxed">
            <p className="whitespace-pre-wrap select-text">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex gap-3 my-4 px-2 md:px-0 group font-sans">
      {/* AI Avatar */}
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center shadow-xs">
          <span className="font-serif italic font-bold text-xs text-white">HK</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-serif font-bold text-white tracking-wide">HK Samrat AI</span>
          {message.modelUsed && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#141414] text-[#888] font-mono border border-[#262626] uppercase">
              {message.modelUsed === 'samrat-reasoner'
                ? 'Reason'
                : message.modelUsed === 'samrat-search'
                ? 'Web'
                : 'Turbo'}
            </span>
          )}
          {message.thinkingDurationMs && (
            <span className="text-[10px] text-[#555] font-mono">
              {(message.thinkingDurationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {/* Thought Process Dropdown (Deep Reasoning Mode) */}
        {thought && (
          <div className="mb-3 rounded-xl border border-[#262626] bg-[#111111] overflow-hidden">
            <button
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-purple-300 hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider">Thought Process Chain</span>
              </div>
              {isThinkingOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {isThinkingOpen && (
              <div className="p-3 border-t border-[#262626] text-xs text-[#999] font-mono whitespace-pre-wrap leading-relaxed bg-[#0A0A0A]">
                {thought}
              </div>
            )}
          </div>
        )}

        {/* Grounding Web Sources if available */}
        {message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mb-3 p-2.5 rounded-xl border border-[#262626] bg-[#121212]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Sources ({message.groundingSources.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.groundingSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#2B2B2B] text-xs text-[#AAA] hover:text-white transition-all max-w-[220px] truncate"
                  title={source.title}
                >
                  <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="truncate">{source.title || source.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Main Markdown Content */}
        <div className="text-sm text-[#E5E5E5] leading-relaxed space-y-2 select-text font-sans">
          {message.isStreaming && !content ? (
            <div className="flex items-center gap-2 text-[#777] text-xs py-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span>Generating response...</span>
            </div>
          ) : content.startsWith('⚠️') || content.includes('Rate limit') || content.includes('quota') || content.includes('high demand') || content.includes('UNAVAILABLE') || content.includes('तकनीकी') ? (
            <div className="my-2 p-4 rounded-xl bg-[#140F0F] border border-amber-900/40 text-amber-200/90 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">⚠️</span>
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">
                    HK Samrat AI Notice
                  </p>
                  <p className="text-amber-200/80 leading-relaxed">
                    {(() => {
                      const clean = content.replace(/^⚠️\s*/, '');
                      if (clean.includes('API_KEY') || clean.includes('GEMINI') || clean.includes('gemini') || clean.includes('apiKey') || clean.includes('Vercel')) {
                        return 'HK Samrat AI सर्वर में तकनीकी समस्या आ रही है। कृपया कुछ पलों बाद "Retry Message" पर क्लिक करें।';
                      }
                      return clean;
                    })()}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-900/30 flex items-center gap-2">
                <button
                  onClick={() => regenerateMessage(message.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-[11px] uppercase transition-all cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry Message</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        {!message.isStreaming && (
          <div className="flex items-center gap-2 mt-3 text-[#666] text-xs font-mono">
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center gap-1"
              title="Copy Message"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase">Copy</span>
                </>
              )}
            </button>

            {isCurrentlyLoadingSpeech ? (
              <button
                disabled
                className="px-2.5 py-1 rounded-lg text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5"
                title="Preparing voice..."
              >
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300">Loading...</span>
              </button>
            ) : isCurrentlySpeaking ? (
              <div className="flex items-center gap-1">
                {/* Pause Button - saves exact spot */}
                <button
                  onClick={() => pauseSpeech()}
                  className="px-2.5 py-1 rounded-lg text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  title="Pause speaking (saves current position)"
                >
                  <div className="flex items-end gap-0.5 h-3 w-3 shrink-0 text-amber-400">
                    <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-2"></span>
                    <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_300ms] h-3"></span>
                    <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_200ms] h-1.5"></span>
                  </div>
                  <Pause className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Pause</span>
                </button>

                {/* Stop Button - resets position */}
                <button
                  onClick={() => stopSpeech()}
                  className="px-2 py-1 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1 transition-colors"
                  title="Stop completely"
                >
                  <Square className="w-3 h-3 text-red-400 fill-current" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Stop</span>
                </button>
              </div>
            ) : isCurrentlyPaused ? (
              <div className="flex items-center gap-1">
                {/* Resume Button - continues from exact word/timestamp */}
                <button
                  onClick={() => resumeSpeech(message.id, content)}
                  className="px-2.5 py-1 rounded-lg text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 font-semibold shadow-xs animate-pulse flex items-center gap-1.5 transition-all"
                  title="Resume speaking from exact paused position"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Resume</span>
                </button>

                {/* Stop Button - resets position */}
                <button
                  onClick={() => stopSpeech()}
                  className="px-2 py-1 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1 transition-colors"
                  title="Stop completely"
                >
                  <Square className="w-3 h-3 text-red-400 fill-current" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Stop</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => speakText(message.id, content)}
                className="px-2.5 py-1 rounded-lg text-[#888] bg-[#141414] hover:bg-[#1E1E1E] hover:text-white border border-[#262626] transition-all flex items-center gap-1.5"
                title="Speak response in natural voice"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Speak</span>
              </button>
            )}

            <button
              onClick={() => regenerateMessage(message.id)}
              className="p-1.5 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors flex items-center gap-1"
              title="Regenerate response"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase">Retry</span>
            </button>

            <div className="h-3 w-px bg-[#262626] mx-1" />

            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors ${
                feedback === 'up' ? 'text-emerald-400' : 'hover:text-white'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors ${
                feedback === 'down' ? 'text-red-400' : 'hover:text-white'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
