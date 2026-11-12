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

export default LANGUAGE_OPTIONS;