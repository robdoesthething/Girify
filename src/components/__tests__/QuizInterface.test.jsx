import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizInterface from '../QuizInterface';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Wrapper component with ThemeProvider
const renderWithTheme = component => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('QuizInterface Component', () => {
  const mockOptions = [
    { id: '1', name: 'Carrer de Balmes' },
    { id: '2', name: 'Avinguda Diagonal' },
    { id: '3', name: 'Passeig de Gràcia' },
    { id: '4', name: 'Carrer de Aragó' },
  ];

  const mockHintStreets = [
    { id: 'h1', name: 'Carrer de València' },
    { id: 'h2', name: 'Carrer de Provença' },
    { id: 'h3', name: 'Carrer de Mallorca' },
  ];

  const defaultProps = {
    questionIndex: 0,
    totalQuestions: 10,
    score: 0,
    options: mockOptions,
    onSelectOption: vi.fn(),
    onNext: vi.fn(),
    feedback: 'idle',
    correctName: 'Carrer de Balmes',
    hintStreets: mockHintStreets,
    onHintReveal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all answer options', () => {
      renderWithTheme(<QuizInterface {...defaultProps} />);

      mockOptions.forEach(option => {
        expect(screen.getByText(option.name)).toBeInTheDocument();
      });
    });

    it('should render hints section when feedback is idle', () => {
      renderWithTheme(<QuizInterface {...defaultProps} />);

      expect(screen.getByText('Hints')).toBeInTheDocument();
      expect(screen.getByText('Reveal Hint')).toBeInTheDocument();
    });

    it('should not render hints section when feedback is not idle', () => {
      renderWithTheme(<QuizInterface {...defaultProps} feedback="transitioning" />);

      expect(screen.queryByText('Hints')).not.toBeInTheDocument();
    });

    it('should render Next button when feedback is not idle', () => {
      renderWithTheme(<QuizInterface {...defaultProps} feedback="transitioning" />);

      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should render Finish Quiz button on last question', () => {
      renderWithTheme(
        <QuizInterface
          {...defaultProps}
          questionIndex={9}
          totalQuestions={10}
          feedback="transitioning"
        />
      );

      expect(screen.getByText('Finish Quiz')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('should call onSelectOption when an answer is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<QuizInterface {...defaultProps} />);

      const firstOption = screen.getByText('Carrer de Balmes');
      await user.click(firstOption);

      expect(defaultProps.onSelectOption).toHaveBeenCalledTimes(1);
      expect(defaultProps.onSelectOption).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('should not allow selection when feedback is not idle', async () => {
      const user = userEvent.setup();
      const onSelectOption = vi.fn();

      renderWithTheme(
        <QuizInterface {...defaultProps} feedback="transitioning" onSelectOption={onSelectOption} />
      );

      const firstOption = screen.getByText('Carrer de Balmes');
      await user.click(firstOption);

      expect(onSelectOption).not.toHaveBeenCalled();
    });

    it('should highlight selected option', async () => {
      const user = userEvent.setup();
      renderWithTheme(<QuizInterface {...defaultProps} />);

      const firstOption = screen.getByText('Carrer de Balmes');
      await user.click(firstOption);

      // Check if the button has the selected styling
      const button = firstOption.closest('button');
      expect(button).toHaveClass('ring-2', 'ring-sky-500');
    });

    it('should allow selecting different options', async () => {
      const user = userEvent.setup();
      const onSelectOption = vi.fn();

      renderWithTheme(<QuizInterface {...defaultProps} onSelectOption={onSelectOption} />);

      // Select first option
      await user.click(screen.getByText('Carrer de Balmes'));
      expect(onSelectOption).toHaveBeenCalledWith(mockOptions[0]);

      // Select second option
      await user.click(screen.getByText('Avinguda Diagonal'));
      expect(onSelectOption).toHaveBeenCalledWith(mockOptions[1]);

      expect(onSelectOption).toHaveBeenCalledTimes(2);
    });
  });

  describe('Hint System', () => {
    it('should reveal first hint when Reveal Hint is clicked', async () => {
      const user = userEvent.setup();
      const onHintReveal = vi.fn();

      renderWithTheme(<QuizInterface {...defaultProps} onHintReveal={onHintReveal} />);

      await user.click(screen.getByText('Reveal Hint'));

      expect(onHintReveal).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.getByText(/Near: Carrer de València/)).toBeInTheDocument();
      });
    });

    it('should reveal multiple hints sequentially', async () => {
      const user = userEvent.setup();
      renderWithTheme(<QuizInterface {...defaultProps} />);

      // Reveal first hint
      await user.click(screen.getByText('Reveal Hint'));
      await waitFor(() => {
        expect(screen.getByText(/Near: Carrer de València/)).toBeInTheDocument();
      });

      // Reveal second hint
      await user.click(screen.getByText('Reveal Hint'));
      await waitFor(() => {
        expect(screen.getByText(/Near: Carrer de Provença/)).toBeInTheDocument();
      });

      // Reveal third hint
      await user.click(screen.getByText('Reveal Hint'));
      await waitFor(() => {
        expect(screen.getByText(/Near: Carrer de Mallorca/)).toBeInTheDocument();
      });
    });

    it('should not show Reveal Hint button after 3 hints', async () => {
      const user = userEvent.setup();
      renderWithTheme(<QuizInterface {...defaultProps} />);

      // Reveal all 3 hints
      await user.click(screen.getByText('Reveal Hint'));
      await user.click(screen.getByText('Reveal Hint'));
      await user.click(screen.getByText('Reveal Hint'));

      // Button should disappear
      await waitFor(() => {
        expect(screen.queryByText('Reveal Hint')).not.toBeInTheDocument();
      });
    });

    it('should not show Reveal Hint button when no hints available', () => {
      renderWithTheme(<QuizInterface {...defaultProps} hintStreets={[]} />);

      expect(screen.queryByText('Reveal Hint')).not.toBeInTheDocument();
    });

    it('should reset hints when question changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(<QuizInterface {...defaultProps} />);

      // Reveal a hint
      await user.click(screen.getByText('Reveal Hint'));
      await waitFor(() => {
        expect(screen.getByText(/Near: Carrer de València/)).toBeInTheDocument();
      });

      // Change question
      rerender(
        <ThemeProvider>
          <QuizInterface {...defaultProps} questionIndex={1} />
        </ThemeProvider>
      );

      // Hint should be hidden again
      await waitFor(() => {
        expect(screen.queryByText(/Near: Carrer de València/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Feedback Display', () => {
    it('should disable all options when feedback is transitioning', () => {
      renderWithTheme(<QuizInterface {...defaultProps} feedback="transitioning" />);

      const buttons = screen
        .getAllByRole('button')
        .filter(btn => mockOptions.some(opt => btn.textContent.includes(opt.name)));

      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should show Next button when feedback is transitioning', () => {
      renderWithTheme(<QuizInterface {...defaultProps} feedback="transitioning" />);

      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should call onNext when Next button is clicked', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      renderWithTheme(<QuizInterface {...defaultProps} feedback="transitioning" onNext={onNext} />);

      await user.click(screen.getByText('Next Question'));

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Question State Reset', () => {
    it('should reset selected answer when question changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(<QuizInterface {...defaultProps} />);

      // Select an answer
      await user.click(screen.getByText('Carrer de Balmes'));

      // Verify selection
      const selectedButton = screen.getByText('Carrer de Balmes').closest('button');
      expect(selectedButton).toHaveClass('ring-2');

      // Change question
      rerender(
        <ThemeProvider>
          <QuizInterface {...defaultProps} questionIndex={1} />
        </ThemeProvider>
      );

      // Selection should be cleared
      await waitFor(() => {
        const button = screen.getByText('Carrer de Balmes').closest('button');
        expect(button).not.toHaveClass('ring-2');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      renderWithTheme(<QuizInterface {...defaultProps} options={[]} />);

      // Should render without crashing
      expect(screen.getByText('Hints')).toBeInTheDocument();
    });

    it('should handle missing correctName', () => {
      renderWithTheme(<QuizInterface {...defaultProps} correctName="" />);

      // Should render without crashing
      expect(screen.getAllByRole('button')).toBeTruthy();
    });

    it('should handle questionIndex of 0', () => {
      renderWithTheme(<QuizInterface {...defaultProps} questionIndex={0} />);

      expect(screen.getAllByRole('button')).toBeTruthy();
    });
  });
});
