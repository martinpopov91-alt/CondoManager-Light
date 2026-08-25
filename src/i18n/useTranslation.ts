import { translations, TranslationKey, Language } from './translations';
import { useLanguageStore } from './store';

export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return { t, language, setLanguage };
}
