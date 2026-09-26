import React from 'react';
import { languages, type Language } from './I18nProvider';
import { useI18n } from './useI18n';

// Each language is named in its own script, so a reader can find theirs whatever is showing now.
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, t } = useI18n();
  return (
    <label className={`language-switcher ${className ?? ''}`}>
      <span className="visually-hidden">{t('language.label')}</span>
      <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
      <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
        {languages.map((option) => <option key={option.code} value={option.code} lang={option.code}>{option.label}</option>)}
      </select>
    </label>
  );
};
