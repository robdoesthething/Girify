import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { storage } from '../../../utils/storage';
import { themeClasses } from '../../../utils/themeUtils';

interface Step {
  target: string;
  title: string;
  content: string;
  position: 'center' | 'top' | 'bottom' | 'top-right';
}

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      target: 'center',
      title: 'Welcome to the Neighborhood!',
      content:
        "Hola! I am Mayor Jaume. I run this district, and I'm looking for someone who knows these streets.",
      position: 'center',
    },
    {
      target: 'map-area',
      title: 'The Challenge',
      content:
        "I'll highlight a street on the map. You need to identify it. Zoom, pan, do whatever... just don't get lost.",
      position: 'top',
    },
    {
      target: 'quiz-input',
      title: 'Prove Yourself',
      content: 'Select the correct street name. Be quick! Tourists are slow. Locals are fast.',
      position: 'bottom',
    },
    {
      target: 'top-bar-coins',
      title: 'Earn Respect (and Giuros)',
      content:
        'Score points to earn Giuros. Use them to buy fancy titles and look important, like me!',
      position: 'top-right',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      storage.set('girify_onboarding_completed', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`max-w-xl w-full p-0 rounded-3xl shadow-2xl overflow-hidden ${themeClasses(theme, 'bg-slate-900 border border-slate-700 text-white', 'bg-white text-slate-900')}`}
        role="dialog"
        aria-label={steps[step]?.title || 'Onboarding'}
      >
        {/* Dialogue Header with Mayor Jaume */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-6 pb-12 relative">
          <div className="absolute -bottom-10 left-6 z-10 w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-900 bg-sky-800 shadow-lg overflow-hidden">
            <img
              src="/assets/pixel_mayor_jaume.png"
              alt="Mayor Jaume"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="ml-24 pl-4 text-white">
            <h2 className="text-xl font-black uppercase tracking-wider opacity-80">Mayor Jaume</h2>
            <p className="text-xs font-bold opacity-60">District Manager</p>
          </div>
        </div>

        <div className="flex flex-col pt-12 p-8 space-y-6">
          <h2 className="text-2xl font-black">{steps[step]?.title}</h2>

          {/* Dialogue Box Style */}
          <div
            className={`p-5 rounded-2xl italic text-lg leading-relaxed relative ${themeClasses(theme, 'bg-slate-800 text-slate-200', 'bg-slate-100 text-slate-700')}`}
          >
            <span className="text-4xl absolute -top-4 -left-2 opacity-20">❝</span>
            {steps[step]?.content}
            <span className="text-4xl absolute -bottom-6 -right-2 opacity-20">❞</span>
          </div>

          <div className="flex gap-2 w-full pt-4">
            <button
              onClick={() => {
                storage.set('girify_onboarding_completed', 'true');
                onComplete();
              }}
              className="px-6 py-4 font-bold opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity outline-none focus:ring-2 focus:ring-sky-500 rounded-xl"
              type="button"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-bold shadow-lg shadow-yellow-500/20 text-lg transition-all transform hover:scale-105"
              type="button"
            >
              {step === steps.length - 1 ? 'Start Playing!' : 'Next ➤'}
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingTour;
