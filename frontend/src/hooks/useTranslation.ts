import { useTheme } from '../contexts/ThemeContext';
import { translations, TranslationKey } from '../lib/translations';

export const useTranslation = () => {
  const { language } = useTheme();

  const t = (key: TranslationKey, replacements?: Record<string, string | number>) => {
    const lang = language as keyof typeof translations;
    const currentTranslations = translations[lang] || translations.fr;
    let translation = currentTranslations[key] || translations.fr[key] || String(key || '');

    if (replacements && translation) {
      Object.keys(replacements).forEach(rKey => {
        const val = replacements[rKey];
        if (val !== undefined && val !== null) {
          translation = translation.replace(`{${rKey}}`, String(val));
        }
      });
    }

    return translation;
  };

  return { t, language };
};