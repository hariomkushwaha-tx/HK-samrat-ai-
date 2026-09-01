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
  HelpCircle,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { MessageAttachment } from '../types';
import { enhancePrompt } from '../services/api';

export const InputArea: React.FC = () => {
  const {
    sendMessage,
    isGenerating,
    stopGenerating,
    activeModel,
    setActiveModel,
    settings,
    updateSettings,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newAttachment: MessageAttachment = {
          id: 'att_' + Date.now() + Math.random(),
          name: file.name,
          mimeType: file.type,
          data: base64,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random(),
              name: file.name,
              mimeType: file.type,
              data: base64,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-4xl mx-auto w-full font-sans">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl bg-[#121212] border transition-all shadow-sm ${
          isDragOver
            ? 'border-blue-400 bg-[#181818]'
            : 'border-[#262626] focus-within:border-[#444]'
        }`}
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="p-2.5 flex flex-wrap gap-2 border-b border-[#262626]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group rounded-lg overflow-hidden border border-[#333] bg-[#161616] max-w-[120px] shadow-xs"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img src={att.data} alt={att.name} className="h-16 w-full object-cover" />
                ) : (
                  <div className="h-16 p-2 flex items-center justify-center text-[10px] text-[#888] text-center font-mono">
                    {att.name}
                  </div>
                )}
                <button
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <div className="p-3.5">
          <textarea
            id="chat-input-textarea"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speech... Speak now'
                : 'Message HK Samrat AI... (Hindi, Hinglish, or English)'
            }
            className="w-full bg-transparent text-sm md:text-base text-[#F5F5F5] placeholder-[#555] focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
          />
        </div>

        {/* Control Toolbar */}
        <div className="px-3 pb-3 flex items-center justify-between gap-2 select-none">
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
              className="p-1.5 rounded-lg text-[#777] hover:text-white hover:bg-[#1A1A1A] border border-transparent hover:border-[#262626] transition-colors"
              title="Attach Images or Code Files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Dictation Button */}
            <button
              id="input-voice-dictation-btn"
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-950/60 text-red-400 border border-red-500/50 animate-pulse'
                  : 'text-[#777] hover:text-white hover:bg-[#1A1A1A] border border-transparent hover:border-[#262626]'
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
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                isEnhancing
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 animate-pulse'
                  : input.trim()
                  ? 'bg-[#181818] hover:bg-[#222] border-[#2B2B2B] hover:border-[#444] text-[#AAA] hover:text-white'
                  : 'opacity-30 cursor-not-allowed border-transparent text-[#555]'
              }`}
              title="Supercharge prompt with HK Samrat AI Prompt Crafter"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="hidden sm:inline text-[10px] uppercase">
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </span>
            </button>

            {/* Quick Engine Pills */}
            <button
              id="quick-pill-search"
              onClick={() =>
                updateSettings({ enableSearchGrounding: !settings.enableSearchGrounding })
              }
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border transition-all ${
                settings.enableSearchGrounding || activeModel === 'samrat-search'
                  ? 'bg-[#1C1C1C] border-blue-500/50 text-blue-400'
                  : 'bg-[#161616] border-[#262626] text-[#666] hover:text-[#AAA]'
              }`}
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Search</span>
            </button>

            <button
              id="quick-pill-reason"
              onClick={() =>
                updateSettings({ enableThinkingProcess: !settings.enableThinkingProcess })
              }
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border transition-all ${
                settings.enableThinkingProcess || activeModel === 'samrat-reasoner'
                  ? 'bg-[#1C1C1C] border-purple-500/50 text-purple-400'
                  : 'bg-[#161616] border-[#262626] text-[#666] hover:text-[#AAA]'
              }`}
            >
              <BrainCircuit className="w-2.5 h-2.5" />
              <span>Reason</span>
            </button>
          </div>

          {/* Send / Stop Button */}
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                id="input-stop-generating-btn"
                onClick={stopGenerating}
                className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 transition-all shadow-xs"
                title="Stop Generating"
              >
                <Square className="w-3.5 h-3.5 fill-red-400" />
              </button>
            ) : (
              <button
                id="input-send-message-btn"
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className={`p-2 rounded-lg transition-all ${
                  input.trim() || attachments.length > 0
                    ? 'bg-white text-black hover:bg-[#E5E5E5] shadow-xs'
                    : 'bg-[#1A1A1A] text-[#555] cursor-not-allowed border border-[#262626]'
                }`}
                title="Send Message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center text-[10px] font-mono text-[#555] mt-1.5 px-1">
        <span>HK Samrat AI can make mistakes. Verify important facts.</span>
      </div>
    </div>
  );
};
