import React, { useEffect, useRef, useState } from 'react';
import { ADSENSE_CONFIG } from '../config/adsense';

interface AdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  minHeight?: number | string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slot = ADSENSE_CONFIG.defaultSlotId,
  format = 'auto',
  responsive = true,
  className = '',
  minHeight = '90px',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const [adError, setAdError] = useState(false);
  const pushedRef = useRef(false);

  const isConfigured =
    ADSENSE_CONFIG.clientId &&
    !ADSENSE_CONFIG.clientId.includes('XXXXXXXX') &&
    slot &&
    slot !== '1234567890';

  useEffect(() => {
    if (!ADSENSE_CONFIG.enabled || !isConfigured || pushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
        adsbygoogle.push({});
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle = adsbygoogle;
        pushedRef.current = true;
      }
    } catch {
      setAdError(true);
    }
  }, [isConfigured]);

  if (!ADSENSE_CONFIG.enabled || !isConfigured || adError) {
    return null;
  }

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-[#111] border border-[#222] p-2 text-center my-3 transition-all ${className}`}
      style={{ minHeight }}
    >
      <div className="flex items-center justify-between text-[9px] font-mono text-[#555] uppercase tracking-wider px-1 pb-1 mb-1 border-b border-[#1c1c1c]">
        <span>Advertisement</span>
        <span className="text-[#444]">Google AdSense</span>
      </div>

      <div className="w-full flex items-center justify-center overflow-hidden">
        {isConfigured ? (
          <ins
            ref={adRef}
            className="adsbygoogle block w-full text-center"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CONFIG.clientId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        ) : (
          <div className="py-4 px-3 flex flex-col items-center justify-center text-[#666] text-xs">
            <span className="font-mono text-[11px] text-blue-400/90 font-medium">Google AdSense Ready</span>
            <span className="text-[10px] text-[#555] mt-0.5">
              Slot ID: {slot} | Client: {ADSENSE_CONFIG.clientId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
