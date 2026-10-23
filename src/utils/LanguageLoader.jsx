const loadLanguage = async (lang) => {
    try {
        const translations = await import(`../Translations/${lang}.json`);
        return translations.default || translations || {};
    } catch (error) {
        console.log(`Error loading language file for ${lang}`, error);
        return {};
    }
};

export default loadLanguage;