import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock framer-motion so motion.div just renders as a plain div
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    t: (key: string) => key,
  }),
}));

// Mock storage — use vi.hoisted to avoid the "before initialization" error
const { mockStorageSet } = vi.hoisted(() => ({ mockStorageSet: vi.fn() }));
vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: vi.fn(),
    set: mockStorageSet,
    remove: vi.fn(),
  },
}));

vi.mock('../../../../utils/themeUtils', () => ({
  themeClasses: (_theme: string, dark: string, _light: string) => dark,
}));

import OnboardingTour from '../OnboardingTour';

describe('OnboardingTour', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 on initial mount', () => {
    render(<OnboardingTour onComplete={onComplete} />);

    // Step 1 title key should be visible
    expect(screen.getByText('onboardingStep1Title')).toBeInTheDocument();
    // The Next button should say 'next' (not 'startPlaying') since it's step 0 of 6
    expect(screen.getByText(/next/i)).toBeInTheDocument();
  });

  it('advances to the next step when Next is clicked', () => {
    render(<OnboardingTour onComplete={onComplete} />);

    const nextBtn = screen.getByText(/next/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText('onboardingStep2Title')).toBeInTheDocument();
  });

  it('advances through all 7 steps in sequence', () => {
    render(<OnboardingTour onComplete={onComplete} />);

    const stepTitles = [
      'onboardingStep1Title',
      'onboardingStep2Title',
      'onboardingStep3Title',
      'onboardingStep4Title',
      'onboardingStep5Title',
      'onboardingStep6Title',
      'onboardingStep7Title',
    ];

    for (let i = 0; i < stepTitles.length; i++) {
      expect(screen.getByText(stepTitles[i]!)).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /next|startPlaying/i });
      fireEvent.click(btn);
    }

    // After the last step Next click, onComplete should be called
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('sets girify_onboarding_completed in storage when finishing the tour', () => {
    render(<OnboardingTour onComplete={onComplete} />);

    // Click through all 7 steps (steps 0–6)
    const TOTAL_STEPS = 7;
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const btn = screen.getByRole('button', { name: /next|startPlaying/i });
      fireEvent.click(btn);
    }

    expect(mockStorageSet).toHaveBeenCalledWith('girify_onboarding_completed', 'true');
  });

  it('calls onComplete and sets storage when Skip is clicked', () => {
    render(<OnboardingTour onComplete={onComplete} />);

    fireEvent.click(screen.getByText('skip'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockStorageSet).toHaveBeenCalledWith('girify_onboarding_completed', 'true');
  });

  it('shows 7 step indicators (dots)', () => {
    const { container } = render(<OnboardingTour onComplete={onComplete} />);

    // The dot indicators are divs with rounded-full class inside the dots row
    const dots = container.querySelectorAll('.rounded-full.w-2.h-2');
    expect(dots).toHaveLength(7);
  });
});
