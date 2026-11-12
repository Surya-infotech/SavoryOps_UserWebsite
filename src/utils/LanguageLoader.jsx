import defaultTranslations from '../Translations/English.json';

const loadLanguage = async (lang) => {
    try {
        if (lang === 'English') return defaultTranslations;
        switch (lang) {
            case 'Arabic': return (await import('../Translations/Arabic.json')).default;
            case 'Chinese (S)': return (await import('../Translations/Chinese (S).json')).default;
            case 'Chinese (T)': return (await import('../Translations/Chinese (T).json')).default;
            case 'Dutch': return (await import('../Translations/Dutch.json')).default;
            case 'Estonian': return (await import('../Translations/Estonian.json')).default;
            case 'Farsi': return (await import('../Translations/Farsi.json')).default;
            case 'French': return (await import('../Translations/French.json')).default;
            case 'German': return (await import('../Translations/German.json')).default;
            case 'Greek': return (await import('../Translations/Greek.json')).default;
            case 'Italian': return (await import('../Translations/Italian.json')).default;
            case 'Polish': return (await import('../Translations/Polish.json')).default;
            case 'Portuguese': return (await import('../Translations/Portuguese.json')).default;
            case 'Portuguese (Brazil)': return (await import('../Translations/Portuguese (Brazil).json')).default;
            case 'Romanian': return (await import('../Translations/Romanian.json')).default;
            case 'Russian': return (await import('../Translations/Russian.json')).default;
            case 'Spanish': return (await import('../Translations/Spanish.json')).default;
            case 'Turkish': return (await import('../Translations/Turkish.json')).default;
            default: return defaultTranslations;
        }
    } catch (error) {
        console.log(`Error loading language file for ${lang}`, error);
        return defaultTranslations;
    }
};

export { defaultTranslations };
export default loadLanguage;