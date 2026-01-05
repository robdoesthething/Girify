import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const OnboardingTour = ({ onComplete }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      target: 'center',
      title: 'Welcome to Girify!',
      content: "Let's take a quick tour to check out the app.",
      position: 'center',
    },
    {
      target: 'map-area',
      title: 'The Challenge',
      content: 'A street will be highlighted on the map. Zoom and pan to find clues!',
      position: 'top',
    },
    {
      target: 'quiz-input',
      title: 'Your Answer',
      content: 'Select the correct street name from the options provided.',
      position: 'bottom', // or right depending on layout
    },
    {
      target: 'top-bar-coins',
      title: 'Earn Rewards',
      content: 'Score points to earn Giuros and unlock cool frames and badges!',
      position: 'top-right',
    },
  ];

  /*
   * Since we can't easily query selectors across the app without complex ref forwarding,
   * we'll use a centered overlay approach for simplicity and robustness,
   * with perhaps some "spotlight" effect if possible, or just modal steps.
   *
   * For MVP: Modal centered card with "Next" button.
   */

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('girify_onboarding_completed', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`max-w-md w-full p-8 rounded-3xl shadow-2xl ${
          theme === 'dark'
            ? 'bg-slate-900 border border-slate-700 text-white'
            : 'bg-white text-slate-900'
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="text-5xl mb-2">
            {step === 0 && '👋'}
            {step === 1 && '🗺️'}
            {step === 2 && '✍️'}
            {step === 3 && '🏆'}
          </div>

          <h2 className="text-2xl font-black">{steps[step].title}</h2>
          <p className="text-lg opacity-80 leading-relaxed min-h-[3em]">{steps[step].content}</p>

          <div className="flex gap-2 w-full pt-4">
            <button
              onClick={() => {
                localStorage.setItem('girify_onboarding_completed', 'true');
                onComplete();
              }}
              className="flex-1 py-4 font-bold opacity-50 hover:opacity-100 transition-opacity"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 text-lg transition-all transform hover:scale-105"
            >
              {step === steps.length - 1 ? "Let's Play!" : 'Next'}
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
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
