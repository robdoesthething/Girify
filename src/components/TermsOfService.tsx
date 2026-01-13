import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TermsOfService: React.FC = () => {
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

        <h1 className="text-4xl font-black mb-8 font-inter">Terms of Service</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">1. Acceptance of Terms</h2>
            <p className="opacity-80 font-inter">
              By accessing and using Girify, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">2. User Conduct</h2>
            <p className="opacity-80 font-inter">You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-80 font-inter">
              <li>Use the service for any illegal purpose.</li>
              <li>Attempt to cheat, exploit, or manipulate game mechanics or leaderboards.</li>
              <li>Harass or harm other users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">3. Disclaimer</h2>
            <p className="opacity-80 font-inter">
              The game is provided &ldquo;as is&rdquo; without warranties of any kind. We are not
              responsible for any errors in map data or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 font-inter">4. Changes to Terms</h2>
            <p className="opacity-80 font-inter">
              We reserve the right to modify these terms at any time. Continued use of the service
              constitutes acceptance of new terms.
            </p>
          </section>

          <div className="pt-8 text-sm opacity-50 font-inter">Last updated: January 2026</div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
