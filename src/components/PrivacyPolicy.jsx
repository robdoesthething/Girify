import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sky-500 font-bold hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
            <p className="opacity-80">
              We collect minimal information to provide the Girify experience:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80">
              <li>Authentication data (via Google or Email) to secure your account.</li>
              <li>Game progress, scores, and shop purchases.</li>
              <li>Basic analytics to understand how the app is used.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Information</h2>
            <p className="opacity-80">Your data is used solely to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80">
              <li>Maintain your profile and game history.</li>
              <li>Display leaderboards and rankings.</li>
              <li>Improve game mechanics and content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Data Security</h2>
            <p className="opacity-80">
              We use Firebase (by Google) to securely store your data. We do not sell your personal
              data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Contact</h2>
            <p className="opacity-80">
              If you have any questions about this policy, please contact us at support@girify.app.
            </p>
          </section>

          <div className="pt-8 text-sm opacity-50">Last updated: January 2026</div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
