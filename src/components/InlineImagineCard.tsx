import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Maximize2,
  X,
  Sliders,
  Check,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { generateImagineArt } from '../services/api';
import { useAI } from '../context/AIContext';

interface InlineImagineCardProps {
  prompt: string;
  initialStyle?: string;
  initialAspectRatio?: string;
  autoGenerate?: boolean;
}

export const InlineImagineCard: React.FC<InlineImagineCardProps> = ({
  prompt,
  initialStyle = 'Photorealistic',
  initialAspectRatio = '1:1',
  autoGenerate = true,
}) => {
  const { setImagineOpen } = useAI();
  const [style, setStyle] = useState(initialStyle);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [styledPrompt, setStyledPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGenerate = async (selectedStyle = style, selectedRatio = aspectRatio) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateImagineArt(prompt, selectedStyle, selectedRatio);
      if (data && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setStyledPrompt(data.styledPrompt || prompt);
      } else {
        throw new Error('No image was returned');
      }
    } catch (err: any) {
      console.error('Inline image generation error:', err);
      setError(err.message || 'फोटो जनरेट करने में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !imageUrl && !isLoading) {
      handleGenerate();
    }
  }, [prompt]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `hk-samrat-photo-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = `hk-samrat-photo-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (e) {
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-[#2B2B2B] bg-[#0E0E0E] shadow-xl overflow-hidden font-sans transition-all">
      {/* Top Banner */}
      <div className="px-4 py-2.5 bg-[#141414] border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            HK Samrat AI Photo Studio
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            Flux 8K
          </span>
        </div>

        {/* Controls & Studio Shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImagineOpen(true)}
            className="flex items-center gap-1 text-[11px] text-[#888] hover:text-white px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#242424] border border-[#333] transition-colors cursor-pointer"
            title="Open Full Imagine Studio"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="p-4 space-y-3">
        {/* Visual Prompt Description */}
        <div className="flex items-start gap-2 bg-[#121212] p-2.5 rounded-xl border border-[#222]">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-[#CCC] leading-relaxed">
            <span className="font-semibold text-white">Prompt: </span>
            <span>{prompt}</span>
          </div>
        </div>

        {/* Image Display or Loading or Error */}
        {isLoading ? (
          <div className="relative w-full aspect-square md:aspect-video rounded-xl bg-gradient-to-br from-[#141414] to-[#1A1A1A] border border-[#2B2B2B] flex flex-col items-center justify-center p-6 overflow-hidden animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-blue-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              🎨 फोटो तैयार की जा रही है...
            </p>
            <p className="text-xs text-[#888] font-mono text-center max-w-sm">
              Synthesizing photorealistic neural render with 8K details & cinematic lighting
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-center space-y-2.5">
            <p className="text-xs text-red-300">{error}</p>
            <button
              onClick={() => handleGenerate()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः प्रयास करें / Retry</span>
            </button>
          </div>
        ) : imageUrl ? (
          <div className="space-y-3">
            <div className="relative group rounded-xl overflow-hidden border border-[#2A2A2A] bg-black shadow-md flex items-center justify-center">
              <img
                src={imageUrl}
                alt={prompt}
                loading="eager"
                className="w-full h-auto max-h-[540px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
              />

              {/* Quick Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-2.5 rounded-xl bg-black/70 hover:bg-black text-white border border-white/20 transition-all shadow-lg hover:scale-105 cursor-pointer"
                  title="Fullscreen View"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/30 transition-all shadow-lg hover:scale-105 cursor-pointer"
                  title="Download HD Photo"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>डाउनलोड फोटो / Download HD</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleGenerate()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-[#DDD] hover:text-white text-xs border border-[#333] transition-colors cursor-pointer"
                  title="Generate a new variation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate / नई फोटो</span>
                </button>
              </div>

              {/* Style & Aspect Ratio Quick Toggles */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
                <select
                  value={style}
                  onChange={(e) => {
                    const newStyle = e.target.value;
                    setStyle(newStyle);
                    handleGenerate(newStyle, aspectRatio);
                  }}
                  className="bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-xs text-[#CCC] focus:outline-hidden"
                >
                  <option value="Photorealistic">📸 Real Photo</option>
                  <option value="3D Render Cinema">💎 3D Octane</option>
                  <option value="Anime Studio">🎨 Anime</option>
                  <option value="Cyberpunk Neon">🌆 Cyberpunk</option>
                  <option value="Digital Masterpiece">🖌️ Painting</option>
                </select>

                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    const newRatio = e.target.value;
                    setAspectRatio(newRatio);
                    handleGenerate(style, newRatio);
                  }}
                  className="bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-xs text-[#CCC] focus:outline-hidden"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Wide</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Standard</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl bg-[#141414] border border-[#222]">
            <button
              onClick={() => handleGenerate()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ फोटो जनरेट करें / Generate HD Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageUrl}
              alt={prompt}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High Definition Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
