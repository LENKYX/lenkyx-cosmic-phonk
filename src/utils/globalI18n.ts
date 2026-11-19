// Universal Worldwide i18n, Geo-Region Auto-Detection & Live Page Translator
// Automatically detects visitor's region/language and translates the entire LENKYX app into 100+ world languages.

export interface WorldLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const WORLD_LANGUAGES: WorldLanguageOption[] = [
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', flag: '🇺🇿' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', rtl: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🌍' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', flag: '🇲🇼' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'jw', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Sinugboanon', flag: '🇵🇭' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'mi', name: 'Maori', nativeName: 'Māori', flag: '🇳🇿' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', flag: '🇼🇸' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌍' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🏛️' },
];

const LANG_STORAGE_KEY = 'lenkyx_user_lang_v1';
const LANG_MANUAL_KEY = 'lenkyx_user_lang_manual_v1';
const TRANS_CACHE_PREFIX = 'lenkyx_tr_v1_';

// Instant zero-latency built-in dictionary for core phrases across top world languages
const CORE_DICT: Record<string, Record<string, string>> = {
  en: {
    'Músicas': 'Music',
    'Explorar': 'Explore',
    'Buscar': 'Search',
    'Cinema': 'Movies & Series',
    'Arena': 'Live Arena',
    'Arcade': 'Arcade',
    'Offline': 'Offline Travel',
    'Criar': 'Create Studio',
    'Baixar App': 'Download App',
    'Compartilhar': 'Share',
    'Jogos': 'Gaming Mode',
    'Modo Jogos': 'Gaming Mode',
    'Pular Intro': 'Skip Intro',
    'Parar Tudo': 'Stop All',
    'Instalar': 'Install',
    'Site Oficial & App': 'Official Site & App',
    '100% Seguro & Verificado': '100% Safe & Verified',
    'Idioma': 'Language',
    'Playlists': 'Playlists',
    'Clipes': 'Videos',
  },
  es: {
    'Músicas': 'Música',
    'Explorar': 'Explorar',
    'Buscar': 'Buscar',
    'Cinema': 'Cine y Series',
    'Arena': 'Arena en Vivo',
    'Arcade': 'Arcade',
    'Offline': 'Modo Viaje',
    'Criar': 'Estudio',
    'Baixar App': 'Descargar App',
    'Compartilhar': 'Compartir',
    'Jogos': 'Modo Gamer',
    'Modo Jogos': 'Modo Gamer',
    'Pular Intro': 'Saltar Intro',
    'Parar Tudo': 'Detener Todo',
    'Instalar': 'Instalar',
    'Site Oficial & App': 'Sitio Oficial y App',
    '100% Seguro & Verificado': '100% Seguro y Verificado',
    'Idioma': 'Idioma',
    'Playlists': 'Listas',
    'Clipes': 'Videos',
  },
  fr: {
    'Músicas': 'Musique',
    'Explorar': 'Explorer',
    'Buscar': 'Rechercher',
    'Cinema': 'Cinéma & Séries',
    'Arena': 'Arène Live',
    'Offline': 'Hors-ligne',
    'Criar': 'Créer',
    'Baixar App': "Télécharger l'App",
    'Compartilhar': 'Partager',
    'Jogos': 'Mode Jeu',
    'Pular Intro': "Passer l'intro",
    'Parar Tudo': 'Tout arrêter',
    'Instalar': 'Installer',
    'Idioma': 'Langue',
  },
  de: {
    'Músicas': 'Musik',
    'Explorar': 'Entdecken',
    'Buscar': 'Suchen',
    'Cinema': 'Kino & Serien',
    'Arena': 'Live-Arena',
    'Offline': 'Offline-Modus',
    'Criar': 'Studio',
    'Baixar App': 'App laden',
    'Compartilhar': 'Teilen',
    'Jogos': 'Gaming-Modus',
    'Pular Intro': 'Intro überspringen',
    'Parar Tudo': 'Alles stoppen',
    'Instalar': 'Installieren',
    'Idioma': 'Sprache',
  },
  it: {
    'Músicas': 'Musica',
    'Explorar': 'Esplora',
    'Buscar': 'Cerca',
    'Cinema': 'Cinema e Serie',
    'Arena': 'Arena Live',
    'Offline': 'Offline',
    'Criar': 'Crea',
    'Baixar App': 'Scarica App',
    'Compartilhar': 'Condividi',
    'Jogos': 'Modalità Gioco',
    'Pular Intro': 'Salta Intro',
    'Parar Tudo': 'Ferma Tutto',
    'Instalar': 'Installa',
    'Idioma': 'Lingua',
  },
  ja: {
    'Músicas': '音楽',
    'Explorar': '探索',
    'Buscar': '検索',
    'Cinema': '映画・ドラマ',
    'Arena': 'ライブアリーナ',
    'Offline': 'オフライン',
    'Criar': 'スタジオ',
    'Baixar App': 'アプリを入手',
    'Compartilhar': '共有',
    'Jogos': 'ゲームモード',
    'Pular Intro': 'イントロをスキップ',
    'Parar Tudo': 'すべて停止',
    'Instalar': 'インストール',
    'Idioma': '言語',
  },
  ko: {
    'Músicas': '음악',
    'Explorar': '탐색',
    'Buscar': '검색',
    'Cinema': '영화 및 시리즈',
    'Arena': '라이브 아레나',
    'Offline': '오프라인',
    'Criar': '스튜디오',
    'Baixar App': '앱 다운로드',
    'Compartilhar': '공유',
    'Jogos': '게이밍 모드',
    'Pular Intro': '인트로 건너뛰기',
    'Parar Tudo': '모두 중지',
    'Instalar': '설치',
    'Idioma': '언어',
  },
  'zh-CN': {
    'Músicas': '音乐',
    'Explorar': '发现',
    'Buscar': '搜索',
    'Cinema': '电影与剧集',
    'Arena': '直播竞技场',
    'Offline': '离线模式',
    'Criar': '创作工作室',
    'Baixar App': '下载应用',
    'Compartilhar': '分享',
    'Jogos': '游戏模式',
    'Pular Intro': '跳过片头',
    'Parar Tudo': '全部停止',
    'Instalar': '安装',
    'Idioma': '语言',
  },
  ar: {
    'Músicas': 'موسيقى',
    'Explorar': 'استكشاف',
    'Buscar': 'بحث',
    'Cinema': 'أفلام ومسلسلات',
    'Arena': 'البث المباشر',
    'Offline': 'بدون إنترنت',
    'Criar': 'الاستوديو',
    'Baixar App': 'تنزيل التطبيق',
    'Compartilhar': 'مشاركة',
    'Jogos': 'وضع الألعاب',
    'Pular Intro': 'تخطي المقدمة',
    'Parar Tudo': 'إيقاف الكل',
    'Instalar': 'تثبيت',
    'Idioma': 'اللغة',
  },
  hi: {
    'Músicas': 'संगीत',
    'Explorar': 'खोजें',
    'Buscar': 'सर्च',
    'Cinema': 'सिनेमा और सीरीज़',
    'Arena': 'लाइव एरीना',
    'Offline': 'ऑफ़लाइन',
    'Criar': 'स्टूडियो',
    'Baixar App': 'ऐप डाउनलोड',
    'Compartilhar': 'शेयर करें',
    'Jogos': 'गेमिंग मोड',
    'Pular Intro': 'इंट्रो छोड़ें',
    'Parar Tudo': 'सब रोकें',
    'Instalar': 'इंस्टॉल',
    'Idioma': 'भाषा',
  },
  ru: {
    'Músicas': 'Музыка',
    'Explorar': 'Обзор',
    'Buscar': 'Поиск',
    'Cinema': 'Кино и Сериалы',
    'Arena': 'Прямой эфир',
    'Offline': 'Офлайн',
    'Criar': 'Студия',
    'Baixar App': 'Скачать',
    'Compartilhar': 'Поделиться',
    'Jogos': 'Игровой режим',
    'Pular Intro': 'Пропустить',
    'Parar Tudo': 'Остановить всё',
    'Instalar': 'Установить',
    'Idioma': 'Язык',
  },
};

export function normalizeLangCode(raw?: string | null): string {
  const s = String(raw || '').trim();
  if (!s) return 'pt';
  const low = s.toLowerCase();
  if (low === 'zh-tw' || low === 'zh-hk' || low === 'zh-hant') return 'zh-TW';
  if (low.startsWith('zh')) return 'zh-CN';
  if (low === 'tl' || low === 'fil') return 'tl';
  if (low === 'jv') return 'jw';
  if (low === 'iw') return 'he';
  const base = low.split(/[-_]/)[0];
  const exact = WORLD_LANGUAGES.find((l) => l.code.toLowerCase() === low);
  if (exact) return exact.code;
  const byBase = WORLD_LANGUAGES.find((l) => l.code.toLowerCase() === base);
  if (byBase) return byBase.code;
  return 'en';
}

export function getLanguageMeta(code: string): WorldLanguageOption {
  const norm = normalizeLangCode(code);
  return WORLD_LANGUAGES.find((l) => l.code === norm) || WORLD_LANGUAGES[1];
}

export function detectVisitorLanguage(): string {
  if (typeof window === 'undefined') return 'pt';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang) {
      const norm = normalizeLangCode(urlLang);
      localStorage.setItem(LANG_STORAGE_KEY, norm);
      return norm;
    }
    if (localStorage.getItem(LANG_MANUAL_KEY) === '1') {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) return normalizeLangCode(saved);
    }
    const navLangs = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
    for (const candidate of navLangs) {
      if (candidate) return normalizeLangCode(candidate);
    }
  } catch {
    // ignore
  }
  return 'pt';
}

export function saveUserLanguage(code: string, manual = true): string {
  const norm = normalizeLangCode(code);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, norm);
    if (manual) localStorage.setItem(LANG_MANUAL_KEY, '1');
  } catch {
    // ignore
  }
  applyDocumentLanguage(norm);
  return norm;
}

export function hasManualLanguageOverride(): boolean {
  try {
    return localStorage.getItem(LANG_MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function applyDocumentLanguage(code: string): void {
  if (typeof document === 'undefined') return;
  const meta = getLanguageMeta(code);
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
}

// === Automatic Live Page-Wide DOM Translator (Zero React Friction) ===
const originalTextMap = new WeakMap<Text, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

const memoryTransCache = new Map<string, Record<string, string>>();
let activeObserver: MutationObserver | null = null;
let activeLang = 'pt';
let pendingStrings = new Set<string>();
let flushTimer: number | null = null;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'NOSCRIPT', 'SVG']);

function shouldSkipText(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length < 2 || t.length > 260) return true;
  // Skip pure numbers, timestamps, URLs, emails, and exact brand wordmark
  if (/^[\d\s.,:%/+-]+$/.test(t)) return true;
  if (/^(https?:\/\/|www\.|mailto:)/i.test(t)) return true;
  if (/^(LENKYX|PIX|BPM|FPS|HD|4K|MP3|MP4|WAV|PWA|APK|USB|HDMI|QR|RGB|UFC|MMA|GTA|PC|TV|iOS)$/i.test(t)) return true;
  return false;
}

function getLangCache(lang: string): Record<string, string> {
  if (memoryTransCache.has(lang)) return memoryTransCache.get(lang)!;
  let disk: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(TRANS_CACHE_PREFIX + lang);
    if (raw) disk = JSON.parse(raw) || {};
  } catch {
    disk = {};
  }
  const merged = { ...(CORE_DICT[lang] || {}), ...disk };
  memoryTransCache.set(lang, merged);
  return merged;
}

function persistLangCache(lang: string, cache: Record<string, string>): void {
  try {
    const entries = Object.entries(cache).slice(-500);
    localStorage.setItem(TRANS_CACHE_PREFIX + lang, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // ignore storage quota
  }
}

function applyCachedTranslationToNode(node: Text, lang: string, cache: Record<string, string>): void {
  const parent = node.parentElement;
  if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest('[data-no-translate="true"]')) return;

  if (!originalTextMap.has(node)) {
    originalTextMap.set(node, node.nodeValue || '');
  }
  const orig = originalTextMap.get(node) || '';
  if (lang === 'pt') {
    if (node.nodeValue !== orig) node.nodeValue = orig;
    return;
  }

  const trimmed = orig.trim();
  if (shouldSkipText(trimmed)) return;

  const translated = cache[trimmed];
  if (translated && translated !== trimmed) {
    const leading = orig.match(/^\s*/)?.[0] || '';
    const trailing = orig.match(/\s*$/)?.[0] || '';
    const nextVal = `${leading}${translated}${trailing}`;
    if (node.nodeValue !== nextVal) node.nodeValue = nextVal;
  } else {
    pendingStrings.add(trimmed);
  }
}

function applyCachedToAttr(el: Element, lang: string, cache: Record<string, string>): void {
  if (el.closest('[data-no-translate="true"]')) return;

  const ph = el.getAttribute('placeholder');
  if (ph !== null) {
    if (!originalPlaceholderMap.has(el)) originalPlaceholderMap.set(el, ph);
    const origPh = originalPlaceholderMap.get(el) || '';
    if (lang === 'pt') {
      if (ph !== origPh) el.setAttribute('placeholder', origPh);
    } else if (!shouldSkipText(origPh)) {
      const tr = cache[origPh.trim()];
      if (tr && tr !== ph) el.setAttribute('placeholder', tr);
      else pendingStrings.add(origPh.trim());
    }
  }

  const title = el.getAttribute('title');
  if (title !== null) {
    if (!originalTitleMap.has(el)) originalTitleMap.set(el, title);
    const origT = originalTitleMap.get(el) || '';
    if (lang === 'pt') {
      if (title !== origT) el.setAttribute('title', origT);
    } else if (!shouldSkipText(origT)) {
      const tr = cache[origT.trim()];
      if (tr && tr !== title) el.setAttribute('title', tr);
      else pendingStrings.add(origT.trim());
    }
  }
}

function scanSubtree(root: Node, lang: string): void {
  if (typeof document === 'undefined') return;
  const cache = getLangCache(lang);

  if (root.nodeType === Node.TEXT_NODE) {
    applyCachedTranslationToNode(root as Text, lang, cache);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const rootEl = root as Element;
  if (SKIP_TAGS.has(rootEl.tagName)) return;

  applyCachedToAttr(rootEl, lang, cache);

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let cur: Node | null = walker.nextNode();
  while (cur) {
    if (cur.nodeType === Node.TEXT_NODE) {
      applyCachedTranslationToNode(cur as Text, lang, cache);
    } else if (cur.nodeType === Node.ELEMENT_NODE) {
      applyCachedToAttr(cur as Element, lang, cache);
    }
    cur = walker.nextNode();
  }
}

async function flushPendingTranslations(lang: string): Promise<void> {
  if (lang === 'pt' || pendingStrings.size === 0) return;
  const batch = Array.from(pendingStrings).slice(0, 35);
  batch.forEach((s) => pendingStrings.delete(s));

  try {
    const res = await fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLang: lang, texts: batch }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data?.translations || typeof data.translations !== 'object') return;
    const cache = getLangCache(lang);
    let updated = false;
    for (const [orig, tr] of Object.entries(data.translations)) {
      if (typeof tr === 'string' && tr.trim()) {
        cache[orig] = tr.trim();
        updated = true;
      }
    }
    if (updated && activeLang === lang) {
      persistLangCache(lang, cache);
      if (document.body) scanSubtree(document.body, lang);
    }
    if (pendingStrings.size > 0 && activeLang === lang) {
      scheduleFlush(lang, 140);
    }
  } catch {
    // offline or transient failure: keep cached dictionary smoothly
  }
}

function scheduleFlush(lang: string, delay = 180): void {
  if (flushTimer !== null) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPendingTranslations(lang);
  }, delay);
}

export function startAutoDomTranslator(langCode: string): () => void {
  const norm = normalizeLangCode(langCode);
  activeLang = norm;
  applyDocumentLanguage(norm);
  pendingStrings.clear();

  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }

  if (typeof document === 'undefined' || !document.body) return () => {};

  scanSubtree(document.body, norm);
  if (norm !== 'pt') scheduleFlush(norm, 100);

  if (norm === 'pt') {
    return () => {};
  }

  const queuedNodes = new Set<Node>();
  let mutationTimer: number | null = null;

  const processQueuedMutations = () => {
    mutationTimer = null;
    const nodes = Array.from(queuedNodes);
    queuedNodes.clear();
    if (!nodes.length) return;
    nodes.forEach((n) => {
      if (document.body.contains(n)) scanSubtree(n, activeLang);
    });
    if (pendingStrings.size > 0) scheduleFlush(activeLang, 220);
  };

  activeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        const textNode = m.target as Text;
        const val = textNode.nodeValue || '';
        const trimmed = val.trim();
        if (!trimmed || shouldSkipText(trimmed)) continue;
        const cache = getLangCache(activeLang);
        if (cache[trimmed]) continue;
        originalTextMap.set(textNode, val);
        queuedNodes.add(textNode);
      } else if (m.type === 'childList') {
        m.addedNodes.forEach((n) => queuedNodes.add(n));
      }
    }
    if (queuedNodes.size > 0 && mutationTimer === null) {
      mutationTimer = window.setTimeout(processQueuedMutations, 90);
    }
  });

  activeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    if (mutationTimer !== null) window.clearTimeout(mutationTimer);
    queuedNodes.clear();
    activeObserver?.disconnect();
    activeObserver = null;
  };
}
