import defaultTranslations from '../Translations/English.json';

const loadLanguage = async (lang) => {
    try {
        if (lang === 'English') return defaultTranslations;
        switch (lang) {
            case 'Arabic': return (await import('../Translations/Arabic.json')).default;
            case 'Dutch': return (await import('../Translations/Dutch.json')).default;
            case 'French': return (await import('../Translations/French.json')).default;
            case 'German': return (await import('../Translations/German.json')).default;
            case 'Greek': return (await import('../Translations/Greek.json')).default;
            case 'Italian': return (await import('../Translations/Italian.json')).default;
            case 'Polish': return (await import('../Translations/Polish.json')).default;
            case 'Portuguese': return (await import('../Translations/Portuguese.json')).default;
            case 'Russian': return (await import('../Translations/Russian.json')).default;
            case 'Spanish': return (await import('../Translations/Spanish.json')).default;
            default: return defaultTranslations;
        }
    } catch (error) {
        console.log(`Error loading language file for ${lang}`, error);
        return defaultTranslations;
    }
};

export { defaultTranslations };
export default loadLanguage;