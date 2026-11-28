const LANGUAGE_OPTIONS = [
  { name: 'Arabic', code: 'SA', short: 'Ara' },
  { name: 'Chinese (S)', code: 'CN', short: 'ZH-S' },
  { name: 'Chinese (T)', code: 'TW', short: 'ZH-T' },
  { name: 'Dutch', code: 'NL', short: 'Dut' },
  { name: 'English', code: 'GB', short: 'Eng' },
  { name: 'Estonian', code: 'EE', short: 'Est' },
  { name: 'Farsi', code: 'IR', short: 'Far' },
  { name: 'French', code: 'FR', short: 'Fre' },
  { name: 'German', code: 'DE', short: 'Ger' },
  { name: 'Greek', code: 'GR', short: 'Gre' },
  { name: 'Italian', code: 'IT', short: 'Ita' },
  { name: 'Polish', code: 'PL', short: 'Pol' },
  { name: 'Portuguese', code: 'PT', short: 'Por' },
  { name: 'Portuguese (Brazil)', code: 'BR', short: 'PT-BR' },
  { name: 'Romanian', code: 'RO', short: 'Rom' },
  { name: 'Russian', code: 'RU', short: 'Rus' },
  { name: 'Spanish', code: 'ES', short: 'Spa' },
  { name: 'Turkish', code: 'TR', short: 'Tur' },
];

const DEFAULT_LANGUAGE = 'English';

const BROWSER_LANG_MAP = {
  ar: 'Arabic',
  nl: 'Dutch',
  en: 'English',
  et: 'Estonian',
  fa: 'Farsi',
  pes: 'Farsi',
  fr: 'French',
  de: 'German',
  el: 'Greek',
  it: 'Italian',
  pl: 'Polish',
  ro: 'Romanian',
  ru: 'Russian',
  es: 'Spanish',
  tr: 'Turkish',
};

const isSupportedLanguage = (lang) =>
  typeof lang === 'string' && LANGUAGE_OPTIONS.some((option) => option.name === lang);

/**
 * Map a browser BCP-47 language tag (e.g. "en-US", "pt-BR", "zh-TW")
 * to a supported software language name, or null if unsupported.
 */
const matchBrowserLanguage = (browserTag) => {
  if (!browserTag || typeof browserTag !== 'string') return null;
  const normalized = browserTag.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return null;

  const parts = normalized.split('-').filter(Boolean);
  const base = parts[0];

  if (base === 'zh') {
    if (
      parts.includes('hant') ||
      parts.includes('tw') ||
      parts.includes('hk') ||
      parts.includes('mo')
    ) {
      return 'Chinese (T)';
    }
    return 'Chinese (S)';
  }

  if (base === 'pt') {
    return parts.includes('br') ? 'Portuguese (Brazil)' : 'Portuguese';
  }

  return BROWSER_LANG_MAP[base] || null;
};

/**
 * Detect the best matching software language from the browser's preferred languages,
 * or null if none of the browser languages are supported.
 */
const detectBrowserLanguage = () => {
  if (typeof navigator === 'undefined') return null;

  const candidates = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language && !candidates.includes(navigator.language)) {
    candidates.unshift(navigator.language);
  }
  if (navigator.userLanguage && !candidates.includes(navigator.userLanguage)) {
    candidates.push(navigator.userLanguage);
  }

  for (const candidate of candidates) {
    const matched = matchBrowserLanguage(candidate);
    if (matched) return matched;
  }

  return null;
};

/**
 * Resolve the initial app language:
 * 1. User's previously saved language in localStorage (if supported)
 * 2. Auto-detected browser language (if supported)
 * 3. Explicit defaultLanguage / VITE_DEFAULT_LANGUAGE (if supported)
 * 4. English fallback
 */
export const resolveInitialLanguage = (defaultLanguage) => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('selectedLanguage');
      if (isSupportedLanguage(saved)) {
        return saved;
      }
    } catch {
      /* ignore storage access errors */
    }

    const detected = detectBrowserLanguage();
    if (detected) {
      return detected;
    }
  }

  if (isSupportedLanguage(defaultLanguage)) {
    return defaultLanguage;
  }

  const envDefault = import.meta.env?.VITE_DEFAULT_LANGUAGE;
  if (isSupportedLanguage(envDefault)) {
    return envDefault;
  }

  return DEFAULT_LANGUAGE;
};

const HTML_LANG_MAP = {
  Arabic: 'ar',
  'Chinese (S)': 'zh-Hans',
  'Chinese (T)': 'zh-Hant',
  Dutch: 'nl',
  English: 'en',
  Estonian: 'et',
  Farsi: 'fa',
  French: 'fr',
  German: 'de',
  Greek: 'el',
  Italian: 'it',
  Polish: 'pl',
  Portuguese: 'pt',
  'Portuguese (Brazil)': 'pt-BR',
  Romanian: 'ro',
  Russian: 'ru',
  Spanish: 'es',
  Turkish: 'tr',
};

export const getHtmlLangCode = (lang) => {
  if (!lang) return 'en';
  const matchedKey = Object.keys(HTML_LANG_MAP).find(
    (k) => k.toLowerCase() === String(lang).trim().toLowerCase()
  );
  return matchedKey ? HTML_LANG_MAP[matchedKey] : 'en';
};

export const isRtlLanguage = (lang) => {
  if (!lang) return false;
  const lower = String(lang).trim().toLowerCase();
  return (
    lower === 'arabic' ||
    lower === 'ar' ||
    lower === 'sa' ||
    lower === 'farsi' ||
    lower === 'persian' ||
    lower === 'fa' ||
    lower === 'ir'
  );
};

export const getLanguageOptions = () => [...LANGUAGE_OPTIONS].sort((a, b) => a.name.localeCompare(b.name));