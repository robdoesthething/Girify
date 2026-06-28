import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Banner from '../Banner';

vi.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', t: (key: string) => key }),
}));

describe('Quiz Banner', () => {
  it('renders the question counter when not in practice mode', () => {
    render(<Banner currentQuestionIndex={2} totalQuestions={10} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('renders an exit button instead of the counter in practice mode', () => {
    const onExit = vi.fn();
    render(<Banner currentQuestionIndex={2} totalQuestions={3} practiceMode onExit={onExit} />);
    expect(screen.queryByText('3/3')).not.toBeInTheDocument();
    const exitButton = screen.getByRole('button');
    fireEvent.click(exitButton);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
