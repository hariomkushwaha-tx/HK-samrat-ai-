import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Palette,
  Wand2,
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { GeneratedImage } from '../types';
import { generateImagineArt, enhancePrompt } from '../services/api';

export const ImagineStudio: React.FC = () => {
  const { isImagineOpen, setImagineOpen } = useAI();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isImagineOpen) return null;

  const stylesList = [
    { id: 'Photorealistic', name: 'Photorealistic', icon: '📸' },
    { id: 'Cyberpunk Neon', name: 'Cyberpunk Neon', icon: '🌆' },
    { id: 'Anime Studio', name: 'Anime Studio', icon: '🎨' },
    { id: '3D Render Cinema', name: '3D Pixar/Octane', icon: '💎' },
    { id: 'Digital Masterpiece', name: 'Digital Painting', icon: '🖌️' },
    { id: 'Minimalist Vector', name: 'Vector Illustration', icon: '📐' },
  ];

  const quickPrompts = [
    'A futuristic cyber samurai standing on a neon rainy skyscraper in 2088',
    'A glowing mythical phoenix rising from crystalline embers, majestic lighting',
    'Modern glassmorphic finance dashboard UI with glowing holographic charts',
    'An astronaut meditating in a field of bioluminescent alien flowers',
  ];

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(
        `Transform this into a hyper-detailed visual art generation prompt with lighting, atmosphere, lens details: "${prompt}"`
      );
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await generateImagineArt(prompt, style, aspectRatio);
      const newImg: GeneratedImage = {
        id: 'img_' + Date.now(),
        prompt,
        enhancedPrompt: result.styledPrompt,
        imageUrl: result.imageUrl,
        style,
        aspectRatio,
        createdAt: Date.now(),
      };
      setGallery((prev) => [newImg, ...prev]);
      setActiveImage(newImg);
    } catch (err: any) {
      alert(err.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.imageUrl;
    a.download = `hk_samrat_imagine_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0E0E0E] border border-[#262626] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#E5E5E5]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] border border-[#333] flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-serif italic font-bold text-white tracking-wide">
                HK Samrat Imagine Studio
              </h2>
              <p className="text-[11px] text-[#888]">
                Multimodal generative visual synthesis with prompt engineering
              </p>
            </div>
          </div>
          <button
            onClick={() => setImagineOpen(false)}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Controls */}
          <div className="w-full lg:w-96 p-5 border-b lg:border-b-0 lg:border-r border-[#262626] space-y-4 overflow-y-auto custom-scrollbar shrink-0 bg-[#101010]">
            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-[#AAA] uppercase">Visual Prompt</label>
                <button
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing}
                  className="flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 disabled:opacity-40"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>{isEnhancing ? 'ENHANCING...' : 'AUTO-ENHANCE'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to imagine... (e.g. Minimalist architectural interior in twilight)"
                className="w-full bg-[#141414] border border-[#262626] rounded-lg p-3 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#555] resize-none leading-relaxed"
              />
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-mono text-[#AAA] mb-2 uppercase">Aesthetic Style</label>
              <div className="grid grid-cols-2 gap-2">
                {stylesList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-2 rounded-lg border text-left text-xs font-medium flex items-center gap-2 transition-all ${
                      style === s.id
                        ? 'bg-[#1C1C1C] border-[#555] text-white shadow-xs'
                        : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-mono text-[#AAA] mb-2 uppercase">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1:1', name: 'Square (1:1)' },
                  { id: '16:9', name: 'Landscape (16:9)' },
                  { id: '9:16', name: 'Portrait (9:16)' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs text-center font-mono transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-[#1C1C1C] border-[#555] text-white'
                        : 'bg-[#141414] border-[#262626] text-[#888] hover:border-[#3B3B3B]'
                    }`}
                  >
                    {ar.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-2.5 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                prompt.trim() && !isGenerating
                  ? 'bg-white hover:bg-[#E5E5E5] text-black shadow-xs'
                  : 'bg-[#1C1C1C] text-[#555] cursor-not-allowed border border-[#262626]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>SYNTHESIZING ARTWORK...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>GENERATE ARTWORK</span>
                </>
              )}
            </button>

            {/* Quick Prompt Ideas */}
            <div>
              <div className="text-[10px] font-mono text-[#777] mb-2 uppercase tracking-wider">
                Inspiration Prompts
              </div>
              <div className="space-y-1.5">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(qp)}
                    className="w-full text-left p-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[11px] text-[#888] hover:text-white transition-colors truncate block"
                  >
                    "{qp}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Preview & Gallery */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center bg-[#0A0A0A]">
            {activeImage ? (
              <div className="w-full max-w-xl flex flex-col items-center gap-4">
                <div className="relative rounded-xl overflow-hidden border border-[#262626] shadow-2xl bg-[#0E0E0E] w-full flex items-center justify-center min-h-[320px]">
                  <img
                    src={activeImage.imageUrl}
                    alt={activeImage.prompt}
                    className="w-full max-h-[460px] object-contain rounded-xl"
                  />
                </div>

                <div className="w-full p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs text-white font-medium truncate">{activeImage.prompt}</p>
                    <span className="text-[10px] text-[#888] font-mono">
                      Style: {activeImage.style} • {activeImage.aspectRatio}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadImage(activeImage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#E5E5E5] text-black text-xs font-mono font-bold transition-all shrink-0 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD</span>
                  </button>
                </div>

                {/* History Thumbnails */}
                {gallery.length > 1 && (
                  <div className="w-full pt-2">
                    <div className="text-[11px] font-mono text-[#888] mb-2 uppercase">
                      Recent Generations ({gallery.length})
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {gallery.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setActiveImage(img)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-all ${
                            activeImage.id === img.id
                              ? 'border-white ring-1 ring-white'
                              : 'border-[#262626] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center max-w-sm p-6 space-y-3">
                <div className="w-14 h-14 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-white shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif italic font-bold text-white">Create with Imagine AI</h3>
                <p className="text-xs text-[#888] leading-relaxed">
                  Type a prompt on the left and select an aesthetic style to generate editorial artwork, illustrations, and concept designs in seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
