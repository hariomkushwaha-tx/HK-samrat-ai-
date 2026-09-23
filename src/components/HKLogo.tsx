import React, { useState } from 'react';

interface HKLogoProps {
  size?: number | string;
  className?: string;
  animated?: boolean;
  variant?: 'emblem' | 'full' | 'minimal';
}

export const HKLogo: React.FC<HKLogoProps> = ({
  size = 32,
  className = '',
  animated = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 32;
  const borderRadius = Math.max(6, Math.round(numSize * 0.24));

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 group ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
    >
      {/* Luxury Royal Gold Aura for prominent sizes */}
      {numSize >= 36 && (
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(245,208,97,0.4) 0%, rgba(201,139,39,0.18) 50%, transparent 75%)',
            transform: 'scale(1.4)',
          }}
        />
      )}

      {!imgError ? (
        <img
          src="/hk_samrat_logo.jpg"
          alt="HK Samrat AI Sovereign Emblem"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-all duration-300 ${
            animated ? 'animate-pulse' : 'group-hover:scale-105'
          }`}
          style={{
            borderRadius: `${borderRadius}px`,
            border: `${Math.max(1, Math.round(numSize * 0.025))}px solid rgba(245, 208, 97, 0.45)`,
            boxShadow:
              numSize >= 40
                ? '0 10px 30px -4px rgba(0,0,0,0.85), 0 0 16px rgba(245,208,97,0.25)'
                : '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(245,208,97,0.2)',
          }}
        />
      ) : (
        /* Bulletproof fallback with solid gold monogram */
        <div
          className="w-full h-full flex flex-col items-center justify-center font-bold text-white relative overflow-hidden"
          style={{
            borderRadius: `${borderRadius}px`,
            background: 'linear-gradient(135deg, #1C1917 0%, #0A0A0C 100%)',
            border: `${Math.max(1, Math.round(numSize * 0.025))}px solid #F5D061`,
            boxShadow: '0 0 14px rgba(245,208,97,0.3)',
          }}
        >
          <span
            style={{
              fontSize: `${Math.max(10, Math.round(numSize * 0.42))}px`,
              lineHeight: 1,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F5D061 55%, #C98B27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HK
          </span>
        </div>
      )}
    </div>
  );
};
