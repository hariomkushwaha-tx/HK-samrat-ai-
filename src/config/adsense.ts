/**
 * Google AdSense Configuration for HK Samrat AI
 * हरिओम कुशवाहा (Hariom Kushwaha / HK Tech World)
 * 
 * Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your official Publisher ID from Google AdSense.
 */

export const ADSENSE_CONFIG = {
  // Google AdSense Publisher Client ID (e.g., 'ca-pub-1234567890123456')
  clientId:
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ADSENSE_CLIENT_ID) ||
    'ca-pub-XXXXXXXXXXXXXXXX',

  // Default Display Ad Unit Slot ID (from your Google AdSense -> Ads -> By ad unit)
  defaultSlotId:
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ADSENSE_SLOT_ID) ||
    'XXXXXXXXXX',

  // Master switch for AdSense units across the application
  enabled: true,
};
