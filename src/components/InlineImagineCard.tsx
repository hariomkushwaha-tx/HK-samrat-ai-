import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Maximize2,
  X,
  Check,
  Palette,
  ExternalLink,
  Camera,
  Copy,
  SlidersHorizontal,
  ChevronRight,
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
  const [activeEngine, setActiveEngine] = useState<'neural' | 'real_photo'>('neural');

  // Image states
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [neuralUrl, setNeuralUrl] = useState<string | null>(null);
  const [fallbackPhotoUrl, setFallbackPhotoUrl] = useState<string | null>(null);
  const [curatedPhotos, setCuratedPhotos] = useState<string[]>([]);
  const [neuralMirrors, setNeuralMirrors] = useState<string[]>([]);
  const [mirrorIndex, setMirrorIndex] = useState(0);

  const [styledPrompt, setStyledPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const timeoutRef = useRef<any>(null);

  const styles = [
    { id: 'Photorealistic', label: '📸 Real Photo' },
    { id: '3D Render Cinema', label: '💎 3D Octane' },
    { id: 'Anime Studio', label: '🎨 Anime' },
    { id: 'Cyberpunk Neon', label: '🌆 Cyberpunk' },
    { id: 'Cinematic Lighting', label: '🎬 Cinematic' },
    { id: 'Digital Masterpiece', label: '🖌️ Painting' },
  ];

  const aspectRatios = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Cinema' },
    { id: '9:16', label: '9:16 Portrait' },
    { id: '4:3', label: '4:3 Classic' },
  ];

  const handleGenerate = async (selectedStyle = style, selectedRatio = aspectRatio) => {
    setIsLoading(true);
    setImageLoaded(false);
    setError(null);
    setGenerationStage(1);

    const stageTimer1 = setTimeout(() => setGenerationStage(2), 900);
    const stageTimer2 = setTimeout(() => setGenerationStage(3), 2200);

    try {
      const data = await generateImagineArt(prompt, selectedStyle, selectedRatio);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (data && (data.imageUrl || data.fallbackPhotoUrl)) {
        const primaryNeural = data.imageUrl || (data.neuralMirrors && data.neuralMirrors[0]);
        const realPhoto = data.fallbackPhotoUrl;

        setNeuralUrl(primaryNeural);
        setFallbackPhotoUrl(realPhoto);
        setCuratedPhotos(data.curatedPhotos || []);
        setNeuralMirrors(data.neuralMirrors || [primaryNeural]);
        setMirrorIndex(0);
        setStyledPrompt(data.styledPrompt || prompt);

        // Preload image
        const targetUrl = activeEngine === 'real_photo' && realPhoto ? realPhoto : primaryNeural;
        setImageUrl(targetUrl);

        // Start fallback watchdog: if primary image doesn't load within 8s, switch to fallback
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (!imageLoaded && realPhoto) {
            console.log('AI neural server slow, auto-switching to verified ultra-HD capture');
            setImageUrl(realPhoto);
            setActiveEngine('real_photo');
          }
        }, 8000);
      } else {
        throw new Error('No image was returned');
      }
    } catch (err: any) {
      console.error('Inline image generation error:', err);
      setError(err.message || 'फोटो जनरेट करने में समस्या आई। पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !imageUrl && !isLoading) {
      handleGenerate();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [prompt]);

  // Handle image load error: Try next neural mirror or fallback photo
  const handleImageError = () => {
    console.warn('Image failed to load, attempting fallback source...');
    if (mirrorIndex + 1 < neuralMirrors.length) {
      const nextIdx = mirrorIndex + 1;
      setMirrorIndex(nextIdx);
      setImageUrl(neuralMirrors[nextIdx]);
    } else if (fallbackPhotoUrl && imageUrl !== fallbackPhotoUrl) {
      setImageUrl(fallbackPhotoUrl);
      setActiveEngine('real_photo');
    } else {
      setError('छवि लोड करने में समस्या आई। कृपया पुनः प्रयास करें।');
    }
  };

  const handleEngineSwitch = (engine: 'neural' | 'real_photo') => {
    setActiveEngine(engine);
    if (engine === 'real_photo' && fallbackPhotoUrl) {
      setImageUrl(fallbackPhotoUrl);
    } else if (engine === 'neural' && neuralUrl) {
      setImageUrl(neuralUrl);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `hk-samrat-photo-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Direct browser blob download
        try {
          const res = await fetch(imageUrl, { referrerPolicy: 'no-referrer' });
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `hk-samrat-photo-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 2000);
            setIsDownloading(false);
            return;
          }
        } catch {
          // Fallback to proxy
        }
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
    } catch {
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(styledPrompt || prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="my-4 rounded-2xl border border-[#2B2B2B] bg-[#0E0E0E] shadow-2xl overflow-hidden font-sans transition-all">
      {/* Top Banner Header */}
      <div className="px-4 py-2.5 bg-[#141414] border-b border-[#262626] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            HK Samrat AI Photo Studio
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            {activeEngine === 'neural' ? 'Neural 8K' : 'Ultra-HD Capture'}
          </span>
        </div>

        {/* Engine Switcher & Full Studio Shortcut */}
        <div className="flex items-center gap-2">
          {fallbackPhotoUrl && (
            <div className="flex items-center bg-[#1A1A1A] rounded-lg p-0.5 border border-[#333]">
              <button
                onClick={() => handleEngineSwitch('neural')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeEngine === 'neural'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#888] hover:text-white'
                }`}
                title="AI Neural Diffusion Art"
              >
                🎨 AI Art
              </button>
              <button
                onClick={() => handleEngineSwitch('real_photo')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeEngine === 'real_photo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#888] hover:text-white'
                }`}
                title="Verified Ultra-HD 4K Real Capture"
              >
                📸 Real 4K
              </button>
            </div>
          )}

          <button
            onClick={() => setImagineOpen(true)}
            className="flex items-center gap-1 text-[11px] text-[#888] hover:text-white px-2 py-1 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] border border-[#333] transition-colors cursor-pointer"
            title="Open Full Imagine Studio"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Studio</span>
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="p-4 space-y-3">
        {/* Visual Prompt Description */}
        <div className="flex items-start justify-between gap-2 bg-[#121212] p-2.5 rounded-xl border border-[#222]">
          <div className="flex items-start gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#CCC] leading-relaxed">
              <span className="font-semibold text-white">Prompt: </span>
              <span>{styledPrompt || prompt}</span>
            </div>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="p-1 rounded text-[#777] hover:text-white transition-colors shrink-0"
            title="Copy prompt"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Image Display or Loading or Error */}
        {isLoading ? (
          <div className="relative w-full aspect-square md:aspect-video rounded-xl bg-gradient-to-br from-[#121212] via-[#161616] to-[#1A1A1A] border border-[#2B2B2B] flex flex-col items-center justify-center p-6 overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 relative">
              <Sparkles className="w-7 h-7 text-blue-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white mb-1.5">
              🎨 फोटो तैयार की जा रही है...
            </p>
            <div className="w-full max-w-xs bg-[#222] h-1.5 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
                style={{
                  width: generationStage === 1 ? '35%' : generationStage === 2 ? '75%' : '95%',
                }}
              />
            </div>
            <p className="text-xs text-[#888] font-mono text-center">
              {generationStage === 1
                ? '⚡ 1/3: Analyzing scene & lighting dynamics...'
                : generationStage === 2
                ? '🎨 2/3: Synthesizing photorealistic neural diffusion...'
                : '✨ 3/3: Rendering 8K details & sharpness...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-center space-y-2.5">
            <p className="text-xs text-red-300">{error}</p>
            <button
              onClick={() => handleGenerate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः प्रयास करें / Retry</span>
            </button>
          </div>
        ) : imageUrl ? (
          <div className="space-y-3">
            <div className="relative group rounded-xl overflow-hidden border border-[#2A2A2A] bg-black shadow-md flex items-center justify-center min-h-[260px]">
              {/* Spinner while image loads */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
                  <Sparkles className="w-6 h-6 text-blue-400 animate-spin mb-2" />
                  <span className="text-xs text-[#777] font-mono">Loading HD visual...</span>
                </div>
              )}

              <img
                src={imageUrl}
                alt={prompt}
                referrerPolicy="no-referrer"
                loading="eager"
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                className={`w-full h-auto max-h-[540px] object-contain rounded-xl transition-all duration-300 group-hover:scale-[1.01] ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Quick Hover Overlay */}
              {imageLoaded && (
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
              )}
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
                  <span>नई फोटो / Regenerate</span>
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
                  className="bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-xs text-[#CCC] focus:outline-hidden cursor-pointer"
                >
                  {styles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    const newRatio = e.target.value;
                    setAspectRatio(newRatio);
                    handleGenerate(style, newRatio);
                  }}
                  className="bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-xs text-[#CCC] focus:outline-hidden cursor-pointer"
                >
                  {aspectRatios.map((ar) => (
                    <option key={ar.id} value={ar.id}>
                      {ar.label}
                    </option>
                  ))}
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
              referrerPolicy="no-referrer"
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
