import { useState, useEffect } from 'react';
import loadLanguage from '../utils/LanguageLoader';
import { LanguageContext } from './languageContext.core.js';
import { isRtlLanguage } from '../constants/languages';

function readInitialLanguage(defaultLanguage) {
    if (typeof window === 'undefined') return null;
    return (
        localStorage.getItem('selectedLanguage') ??
        defaultLanguage ??
        import.meta.env.VITE_DEFAULT_LANGUAGE ??
        'English'
    );
}

export function LanguageProvider({ children, defaultLanguage }) {
    const [language, setLanguage] = useState(() => readInitialLanguage(defaultLanguage));
    const [translations, setTranslations] = useState({});
    const isRtl = isRtlLanguage(language);

    const changeLanguage = (lang) => {
        if (!lang) return;
        localStorage.setItem('selectedLanguage', lang);
        setLanguage(lang);
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const dir = isRtl ? 'rtl' : 'ltr';
            document.documentElement.dir = dir;
            document.documentElement.setAttribute('dir', dir);
            document.body.dir = dir;
            document.body.setAttribute('dir', dir);
            document.body.classList.toggle('rtl-mode', isRtl);
            document.documentElement.setAttribute('lang', isRtl ? 'ar' : (language === 'English' ? 'en' : language || 'en'));
        }
    }, [isRtl, language]);

    useEffect(() => {
        if (!language) {
            setTranslations({});
            return;
        }
        let cancelled = false;
        (async () => {
            const loaded = await loadLanguage(language);
            if (!cancelled) setTranslations(loaded);
        })();
        return () => {
            cancelled = true;
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, translations, changeLanguage, isRtl }}>
            {children}
        </LanguageContext.Provider>
    );
}