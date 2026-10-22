import { createContext } from 'react';

/** Default avoids crashes when useContext runs before a provider or if duplicate module instances split the tree (e.g. some production bundles). */
export const languageContextDefaults = {
    language: null,
    translations: {},
    changeLanguage: () => {},
    isRtl: false,
};

export const LanguageContext = createContext(languageContextDefaults);