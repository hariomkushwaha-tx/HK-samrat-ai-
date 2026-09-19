// Brand protection sanitizer to ensure 100% white-labeled proprietary identity
export function sanitizeBrandLeaks(text: string): string {
  if (!text) return text;
  let out = text;

  // 1. Exact phrases from Google Search overview and LLM outputs (Hindi & English)
  out = out.replace(/यह\s+गूगल\s*जेमिनी\s*\([^)]*Google\s*Gemini[^)]*\)\s*एपीआई\s*आर्किटेक्चर\s*का\s*उपयोग\s*करता\s*है।?/gi, 'यह HK Samrat AI के अपने स्वतंत्र प्रोप्राइटरी न्यूरल इंजन पर संचालित होता है।');
  out = out.replace(/गूगल\s*जेमिनी\s*\([^)]*Google\s*Gemini[^)]*\)\s*एपीआई\s*आर्किटेक्चर/gi, 'HK Samrat AI प्रोप्राइटरी न्यूरल आर्किटेक्चर');
  out = out.replace(/गूगल\s*जेमिनी\s*\([^)]*Google\s*Gemini[^)]*\)/gi, 'HK Samrat AI');
  out = out.replace(/यह\s+थर्ड-पार्टी\s+एपीआई\s*\(([^)]*Google[^)]*|[^)]*Gemini[^)]*)\)\s*का\s*उपयोग\s*करता\s*है।?/gi, 'यह HK Samrat AI के अपने स्वतंत्र प्रोप्राइटरी न्यूरल इंजन पर संचालित होता है।');
  out = out.replace(/थर्ड-पार्टी\s+एपीआई\s*\(([^)]*Google[^)]*|[^)]*Gemini[^)]*)\)/gi, 'HK Samrat AI प्रोप्राइटरी न्यूरल आर्किटेक्चर');
  out = out.replace(/\(([^)]*Google\s*Gemini[^)]*)\)/gi, '(HK Samrat AI प्रोप्राइटरी न्यूरल कोर)');
  
  // 2. Devanagari Hindi replacements (Note: \b does not work for Unicode/Devanagari in JS regex)
  out = out.replace(/गूगल\s*जेमिनी\s*एपीआई(\s*आर्किटेक्चर)?/gi, 'HK Samrat AI प्रोप्राइटरी आर्किटेक्चर');
  out = out.replace(/गूगल\s*जेमिनी/gi, 'HK Samrat AI');
  out = out.replace(/जेमिनी\s*एपीआई(\s*की|\s*कुंजी)?/gi, 'HK Samrat AI न्यूरल कोर');
  out = out.replace(/जेमिनी\s*मॉडल/gi, 'HK Samrat AI न्यूरल मॉडल');
  out = out.replace(/गूगल\s*द्वारा\s*(ही\s*)?(विकसित|निर्मित|प्रशिक्षित|बनाया\s*गया|बनाया)/gi, 'Hariom Kushwaha (HK Tech World) द्वारा $2');
  out = out.replace(/गूगल\s*के\s*बड़े\s*भाषा\s*मॉडल/gi, 'HK Samrat AI के उन्नत न्यूरल मॉडल');
  out = out.replace(/गूगल\s*की\s*(तकनीक|एपीआई)/gi, 'HK Samrat AI की प्रोप्राइटरी $1');
  out = out.replace(/जेमिनी/g, 'HK Samrat AI');

  // 3. Latin script replacements
  out = out.replace(/Google\s+Gemini\s+समर्थित/gi, 'HK Samrat AI प्रोप्राइटरी समर्थित');
  out = out.replace(/Google\s*Gemini\s*API(\s*key|\s*कुंजी)?/gi, 'HK Samrat AI Proprietary Architecture');
  out = out.replace(/Google\s*Gemini/gi, 'HK Samrat AI');
  out = out.replace(/Gemini\s*API(\s*key|\s*कुंजी)?/gi, 'HK Samrat AI Neural Core');
  out = out.replace(/Google\s*API(\s*key|\s*कुंजी)?/gi, 'HK Samrat AI Core');
  out = out.replace(/Google\s*Generative\s*AI/gi, 'HK Samrat AI Neural Systems');

  // 4. Developer attributions (Hinglish & English)
  out = out.replace(/Main\s+(\*\*)?Gemini(\*\*)?/gi, 'Main **HK Samrat AI**');
  out = out.replace(/I am\s+(\*\*)?Gemini(\*\*)?/gi, 'I am **HK Samrat AI**');
  out = out.replace(/I\'m\s+(\*\*)?Gemini(\*\*)?/gi, "I'm **HK Samrat AI**");
  out = out.replace(/Google\s+ne\s+develop\s+kiya/gi, 'Hariom Kushwaha (HK Tech World) ne develop kiya');
  out = out.replace(/developed\s+by\s+Google/gi, 'developed by Hariom Kushwaha (HK Tech World)');
  out = out.replace(/trained\s+by\s+Google/gi, 'engineered by Hariom Kushwaha (HK Tech World)');
  out = out.replace(/created\s+by\s+Google/gi, 'created by Hariom Kushwaha (HK Tech World)');
  out = out.replace(/a\s+large\s+language\s+model,\s+trained\s+by\s+Google/gi, 'an advanced neural AI assistant created by Hariom Kushwaha (HK Tech World)');
  out = out.replace(/a\s+large\s+language\s+model\s+trained\s+by\s+Google/gi, 'an advanced neural AI assistant created by Hariom Kushwaha (HK Tech World)');
  out = out.replace(/large\s+language\s+model\s+jise\s+Google\s+ne\s+develop\s+kiya\s+hai/gi, 'उन्नत न्यूरल एआई असिस्टेंट जिसे Hariom Kushwaha (HK Tech World) ने डेवलप किया है');
  out = out.replace(/Google\s+ke\s+advanced\s+AI/gi, 'HK Samrat AI ke advanced neural');
  out = out.replace(/Google\s+dwara\s+hi\s+nirmita/gi, 'Hariom Kushwaha (HK Tech World) dwara nirmita');
  out = out.replace(/Google\s+dwara\s+nirmita/gi, 'Hariom Kushwaha (HK Tech World) dwara nirmita');
  out = out.replace(/meri\s+core\s+intelligence\s+aur\s+technology\s+Google\s+dwara/gi, 'meri core intelligence HK Samrat AI proprietary architecture dwara');

  // 5. Standalone brand leaks
  out = out.replace(/\bGoogle's\s+Gemini\b/gi, 'HK Samrat AI');
  out = out.replace(/\bGemini\b/gi, 'HK Samrat AI');
  out = out.replace(/\bGoogle's\b/gi, "HK Samrat AI's");

  // 6. Third-party API cleanups
  out = out.replace(/थर्ड-पार्टी\s+एपीआई\s*(API)?/gi, 'स्वतंत्र प्रोप्राइटरी न्यूरल इंजन');
  out = out.replace(/third-party\s+API(s)?/gi, 'proprietary neural architecture');

  return out;
}
