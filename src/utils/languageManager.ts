// languageManager.ts
// Automated Full-Page Translation Controller (English <-> Kannada)

export type AppLanguage = 'en' | 'kn';

const LANGUAGE_STORAGE_KEY = 'app_preferred_language';

const listeners: Array<(lang: AppLanguage) => void> = [];

// Regular expression to identify pure numbers, amounts, percentages, and metrics
const NUMERIC_REGEX = /^[\s\d₹$€£¥,.:/%+—\(\)\-\#\/\\]+$/;

// Automatically protects pure numbers, metric counts, and badges from Google Translate alterations/duplications (e.g. "51 (ಅನುಬಂಧ)")
export const protectNumericElements = (root: Element | Document = document) => {
  try {
    if (!root || !('querySelectorAll' in root)) return;
    const elements = root.querySelectorAll('span, div, p, td, th, h1, h2, h3, h4, h5, h6, b, strong, a');
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && el.children.length === 0 && NUMERIC_REGEX.test(text)) {
        el.setAttribute('translate', 'no');
        el.classList.add('notranslate');
      }
    });
  } catch (e) {
    // Ignore invalid selector errors
  }
};

export const getLanguage = (): AppLanguage => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'kn' || saved === 'en') {
      return saved as AppLanguage;
    }
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    if (match && (match[1] === 'kn' || match[1] === 'en')) {
      return match[1] as AppLanguage;
    }
  } catch (e) {
    console.error('Failed to read language preference', e);
  }
  return 'en';
};

const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${window.location.hostname}; SameSite=Lax`;
  const hostParts = window.location.hostname.split('.');
  if (hostParts.length > 1) {
    const rootDomain = '.' + hostParts.slice(-2).join('.');
    document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=${rootDomain}; SameSite=Lax`;
  }
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  const hostParts = window.location.hostname.split('.');
  if (hostParts.length > 1) {
    const rootDomain = '.' + hostParts.slice(-2).join('.');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
  }
};

// Injects styling to suppress the default Google Translate top banner, toolbar, and balloon popups
const injectGoogleTranslateStyles = () => {
  if (document.getElementById('custom-google-translate-styles')) return;

  const style = document.createElement('style');
  style.id = 'custom-google-translate-styles';
  style.innerHTML = `
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame,
    .goog-te-balloon-frame,
    #goog-gt-tt,
    .goog-tooltip,
    .goog-tooltip:hover,
    .goog-te-spinner-pos,
    .goog-te-spinner,
    .VIpgJd-yAWneb-hvhGLb-SnMDfe,
    .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
    .VIpgJd-ZVi9od-ORHb-OEVmcb,
    #google_translate_element,
    .skiptranslate,
    .skiptranslate.goog-te-gadget {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    body {
      top: 0px !important;
      position: static !important;
    }
    .goog-text-highlight {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
    }
  `;
  document.head.appendChild(style);
};

export const initLanguageEngine = () => {
  injectGoogleTranslateStyles();
  protectNumericElements();

  // Watch for new DOM nodes to protect newly rendered stats and numbers
  if (typeof MutationObserver !== 'undefined' && document.body) {
    const numObserver = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.type === 'childList') {
          mut.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              protectNumericElements(node as Element);
            }
          });
        }
      }
    });
    numObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Ensure cookie matches preference on boot
  const currentLang = getLanguage();
  if (currentLang === 'kn') {
    setCookie('googtrans', '/en/kn');
  } else {
    setCookie('googtrans', '/en/en');
  }
};

export const setLanguage = (lang: AppLanguage) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.error('Failed to save language preference', e);
  }

  protectNumericElements();

  if (lang === 'kn') {
    setCookie('googtrans', '/en/kn');
  } else {
    setCookie('googtrans', '/en/en');
    removeCookie('googtrans');
  }

  // Trigger Google translate select box if mounted
  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (combo) {
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  } else {
    // If not mounted yet, soft reload to translate the whole app on boot
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }

  // Notify registered React components
  listeners.forEach((cb) => cb(lang));
  window.dispatchEvent(new CustomEvent('app_language_changed', { detail: { language: lang } }));
};

export const onLanguageChange = (callback: (lang: AppLanguage) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};
