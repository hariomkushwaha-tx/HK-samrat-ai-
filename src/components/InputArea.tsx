import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  Image as ImageIcon,
  X,
  Globe,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { MessageAttachment } from '../types';
import { enhancePrompt } from '../services/api';
import { compressImageFile } from '../utils/imageCompressor';

export const InputArea: React.FC = () => {
  const {
    sendMessage,
    isGenerating,
    stopGenerating,
    activeModel,
    setActiveModel,
    settings,
    updateSettings,
    setImagineOpen,
  } = useAI();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.voice.language || 'hi-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [settings.voice.language]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    sendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    for (const file of fileList) {
      try {
        const optimized = await compressImageFile(file);
        const newAttachment: MessageAttachment = {
          id: 'att_' + Date.now() + Math.random(),
          name: optimized.name,
          mimeType: optimized.mimeType,
          data: optimized.data,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      } catch (err) {
        console.error('File compression error:', err);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(input);
      setInput(enhanced);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      for (const file of fileList) {
        try {
          const optimized = await compressImageFile(file);
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random(),
              name: optimized.name,
              mimeType: optimized.mimeType,
              data: optimized.data,
            },
          ]);
        } catch (err) {
          console.error('File drop compression error:', err);
        }
      }
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-4xl mx-auto w-full font-sans">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl md:rounded-3xl glass-dock transition-all duration-200 ${
          isDragOver
            ? 'border-amber-400/60 bg-[#16161E]'
            : 'border-white/[0.1] focus-within:border-amber-500/30'
        }`}
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="p-3 flex flex-wrap gap-2 border-b border-white/[0.08]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-white/[0.1] bg-[#121217] max-w-[120px] shadow-sm"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img src={att.data} alt={att.name} className="h-16 w-full object-cover" />
                ) : (
                  <div className="h-16 p-2 flex items-center justify-center text-[10px] text-neutral-400 text-center font-mono">
                    {att.name}
                  </div>
                )}
                <button
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <div className="px-4 pt-3.5 pb-2">
          <textarea
            id="chat-input-textarea"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speech... Speak naturally'
                : 'Message HK Samrat AI... (Hindi, Hinglish, or English)'
            }
            className="w-full bg-transparent text-sm md:text-base text-[#EDEDED] placeholder-neutral-500 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
          />
        </div>

        {/* Control Toolbar */}
        <div className="px-3.5 pb-3 flex items-center justify-between gap-2 select-none">
          {/* Left tools: Upload, Voice, Enhance, Quick toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.txt,.md,.json,.js,.ts,.py,.html,.css"
              className="hidden"
            />
            <button
              id="input-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Attach Images or Files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Dictation Button */}
            <button
              id="input-voice-dictation-btn"
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-950/70 text-red-400 border border-red-500/50 animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title={isListening ? 'Stop Voice Recording' : 'Voice Input (Hindi/English)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Magic Prompt Enhancer */}
            <button
              id="input-enhance-prompt-btn"
              onClick={handleEnhancePrompt}
              disabled={!input.trim() || isEnhancing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isEnhancing
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
                  : input.trim()
                  ? 'bg-[#181822] hover:bg-[#20202D] border-white/[0.1] text-amber-300 hover:text-amber-200'
                  : 'opacity-30 cursor-not-allowed border-transparent text-neutral-500'
              }`}
              title="Supercharge prompt with HK Samrat AI Prompt Crafter"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </span>
            </button>

            {/* Quick Photo Studio Button */}
            <button
              id="input-photo-studio-btn"
              onClick={() => setImagineOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-pink-500/30 bg-pink-950/30 hover:bg-pink-900/40 text-pink-300 hover:text-white transition-all cursor-pointer"
              title="Open HK Samrat AI Imagine Art Studio"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline text-[11px]">
                Imagine
              </span>
            </button>

            {/* Search Grounding toggle */}
            <button
              id="quick-pill-search"
              onClick={() =>
                updateSettings({ enableSearchGrounding: !settings.enableSearchGrounding })
              }
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                settings.enableSearchGrounding || activeModel === 'samrat-search'
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                  : 'bg-[#14141A] border-white/[0.08] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Web</span>
            </button>

            {/* Deep Reasoning toggle */}
            <button
              id="quick-pill-reason"
              onClick={() =>
                updateSettings({ enableThinkingProcess: !settings.enableThinkingProcess })
              }
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                settings.enableThinkingProcess || activeModel === 'samrat-reasoner'
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                  : 'bg-[#14141A] border-white/[0.08] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <BrainCircuit className="w-3 h-3 text-purple-400" />
              <span>Reason</span>
            </button>
          </div>

          {/* Send / Stop Button */}
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                id="input-stop-generating-btn"
                onClick={stopGenerating}
                className="p-2.5 rounded-xl bg-red-900/80 text-red-300 border border-red-700/60 hover:bg-red-800 transition-all shadow-xs cursor-pointer"
                title="Stop Generating"
              >
                <Square className="w-4 h-4 fill-red-300" />
              </button>
            ) : (
              <button
                id="input-send-message-btn"
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  input.trim() || attachments.length > 0
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-md transform hover:scale-105 active:scale-95'
                    : 'bg-[#181822] text-neutral-500 cursor-not-allowed border border-white/[0.06]'
                }`}
                title="Send Message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center text-[10px] text-neutral-500 mt-2 px-1">
        <span>HK Samrat AI Neural Core · Engineered by Hariom Kushwaha (HK Tech World)</span>
      </div>
    </div>
  );
};
