import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getToggleButtonClass } from '../../utils/buttonClasses';
import { themeClasses } from '../../utils/themeUtils';

const LanguageSettings: React.FC = () => {
  const { theme, language, changeLanguage, languages, t } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 font-inter">
        {t('language')}
      </h3>
      <div
        className={`p-4 rounded-xl border ${themeClasses(theme, 'border-slate-800 bg-slate-800/50', 'border-slate-100 bg-slate-50')}`}
      >
        <div className="flex gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all font-inter ${getToggleButtonClass(theme, language === lang.code)}`}
              type="button"
            >
              <span className="mr-1">{lang.flag}</span> {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
