import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Code,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAI } from '../context/AIContext';

export const CanvasSandbox: React.FC = () => {
  const { activeCanvasArtifact, closeCanvas } = useAI();
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!activeCanvasArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCanvasArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      activeCanvasArtifact.type === 'svg'
        ? 'svg'
        : activeCanvasArtifact.type === 'python'
        ? 'py'
        : activeCanvasArtifact.type === 'javascript'
        ? 'js'
        : 'html';

    const blob = new Blob([activeCanvasArtifact.code], {
      type: ext === 'svg' ? 'image/svg+xml' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hk_samrat_canvas_${Date.now()}.${ext}`;
    a.click();
  };

  // Generate runnable HTML code for iframe
  const generateSourceDoc = () => {
    if (activeCanvasArtifact.type === 'svg') {
      return `<!DOCTYPE html><html><head><style>body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0A0A0A; }</style></head><body>${activeCanvasArtifact.code}</body></html>`;
    }

    if (activeCanvasArtifact.type === 'html' || activeCanvasArtifact.type === 'javascript') {
      // If pure html without body/head
      if (!activeCanvasArtifact.code.includes('<!DOCTYPE') && !activeCanvasArtifact.code.includes('<html')) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, sans-serif; background: #0A0A0A; color: #F5F5F5; margin: 0; padding: 20px; }</style>
</head>
<body>
  ${activeCanvasArtifact.code}
</body>
</html>`;
      }
      return activeCanvasArtifact.code;
    }

    // Default fallback container
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: system-ui, -apple-system, sans-serif; background: #0A0A0A; color: #F5F5F5; padding: 20px; }</style>
</head>
<body>
  <div class="p-4 bg-[#141414] border border-[#262626] rounded-xl">
    <h3 class="text-blue-400 font-bold mb-2 font-mono">${activeCanvasArtifact.title}</h3>
    <div class="text-xs text-[#E5E5E5] whitespace-pre-wrap font-mono">${activeCanvasArtifact.code}</div>
  </div>
</body>
</html>`;
  };

  return (
    <div
      className={`border-l border-[#262626] bg-[#0A0A0A] flex flex-col z-30 transition-all font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'w-full lg:w-[45vw] xl:w-[48vw] h-full shrink-0'
      }`}
    >
      {/* Canvas Top Bar */}
      <div className="h-14 px-4 border-b border-[#262626] flex items-center justify-between bg-[#101010] select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#1C1C1C] border border-[#333] flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-xs font-serif italic font-bold text-white truncate">{activeCanvasArtifact.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[#888] border border-[#333] font-mono uppercase">
            {activeCanvasArtifact.type}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#141414] border border-[#262626] text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                viewMode === 'code'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            title="Refresh Sandbox Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            title="Download Artifact File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={closeCanvas}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            title="Close Canvas"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Main Body */}
      <div className="flex-1 overflow-hidden relative bg-[#0A0A0A]">
        {viewMode === 'preview' ? (
          <iframe
            key={iframeKey}
            title="Canvas Live Preview"
            srcDoc={generateSourceDoc()}
            className="w-full h-full border-none bg-[#0A0A0A]"
            sandbox="allow-scripts allow-modals allow-same-origin"
          />
        ) : (
          <div className="p-4 h-full overflow-auto custom-scrollbar font-mono text-xs text-[#E5E5E5] bg-[#0A0A0A]">
            <pre>
              <code>{activeCanvasArtifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
