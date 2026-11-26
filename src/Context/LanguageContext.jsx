import { useState, useEffect } from 'react';
import loadLanguage, { defaultTranslations } from '../utils/LanguageLoader';
import { LanguageContext } from './languageContext.core.js';
import { getHtmlLangCode, isRtlLanguage, resolveInitialLanguage } from '../constants/languages';

function readInitialLanguage(defaultLanguage) {
    return resolveInitialLanguage(defaultLanguage);
}

export function LanguageProvider({ children, defaultLanguage }) {
    const [language, setLanguage] = useState(() => readInitialLanguage(defaultLanguage));
    const [translations, setTranslations] = useState(() => defaultTranslations);
    const isRtl = isRtlLanguage(language);

    const changeLanguage = (lang) => {
        if (!lang) return;
        try {
            localStorage.setItem('selectedLanguage', lang);
        } catch {
            /* ignore storage access errors */
        }
        setLanguage(lang);
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !language) return;
        try {
            if (localStorage.getItem('selectedLanguage') !== language) {
                localStorage.setItem('selectedLanguage', language);
            }
        } catch {
            /* ignore storage access errors */
        }
    }, [language]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const dir = isRtl ? 'rtl' : 'ltr';
            document.documentElement.dir = dir;
            document.documentElement.setAttribute('dir', dir);
            document.body.dir = dir;
            document.body.setAttribute('dir', dir);
            document.body.classList.toggle('rtl-mode', isRtl);
            document.documentElement.setAttribute('lang', getHtmlLangCode(language));
        }
    }, [isRtl, language]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const loaded = language ? await loadLanguage(language) : {};
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