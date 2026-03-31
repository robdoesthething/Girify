import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { themeClasses } from '../utils/themeUtils';

const PrivacyPolicy: React.FC = () => {
  const { theme, t } = useTheme();

  return (
    <div
      className={`min-h-screen p-8 ${themeClasses(theme, 'bg-slate-950 text-slate-300', 'bg-slate-50 text-slate-700')}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sky-500 font-bold hover:underline">
            {t('backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-black mb-8 font-inter">{t('privacyTitle')}</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">{t('privacySection1Title')}</h2>
            <p className="opacity-80 font-inter">{t('privacySection1Intro')}</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 opacity-80 font-inter">
              <li>{t('privacySection1Item1')}</li>
              <li>{t('privacySection1Item2')}</li>
              <li>{t('privacySection1Item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">{t('privacySection2Title')}</h2>
            <p className="opacity-80 font-inter">{t('privacySection2Intro')}</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 opacity-80 font-inter">
              <li>{t('privacySection2Item1')}</li>
              <li>{t('privacySection2Item2')}</li>
              <li>{t('privacySection2Item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">{t('privacySection3Title')}</h2>
            <p className="opacity-80 font-inter">{t('privacySection3Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">{t('privacySection4Title')}</h2>
            <p className="opacity-80 font-inter">{t('privacySection4Content')}</p>
          </section>

          <div className="pt-8 text-sm opacity-50 font-inter">{t('legalLastUpdated')}</div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
