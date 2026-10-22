import { useContext } from 'react';
import { LanguageContext, languageContextDefaults } from './languageContext.core.js';

export function useLanguage() {
    return useContext(LanguageContext) ?? languageContextDefaults;
}