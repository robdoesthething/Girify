import { motion } from 'framer-motion';
import { FC, ReactNode } from 'react';
import Banner from './Banner';
import Hints from './Hints';
import NextButton from './NextButton';
import Options from './Options';

interface QuizProps {
  children?: ReactNode;
  className?: string;
}

interface QuizComponent extends FC<QuizProps> {
  Banner: typeof Banner;
  Options: typeof Options;
  Hints: typeof Hints;
  NextButton: typeof NextButton;
  Container: FC<{ children: ReactNode; keyProp: string | number }>;
  Content: FC<{ children: ReactNode }>;
}

const Quiz: QuizComponent = ({ children, className }) => {
  return (
    <div
      className={`
             w-full h-full flex flex-col pointer-events-auto overflow-hidden
             ${className || ''}
        `}
    >
      {children}
    </div>
  );
};

// Subcomponent for the standard container animations
const Container: FC<{ children: ReactNode; keyProp: string | number }> = ({
  children,
  keyProp,
}) => {
  return (
    <motion.div
      key={keyProp}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  );
};

// Wrapper for the Main content area (Options usually)
const Content: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col justify-evenly p-2 pt-4 w-full overflow-hidden relative z-10">
      {children}
    </div>
  );
};

Quiz.Banner = Banner;
Quiz.Options = Options;
Quiz.Hints = Hints;
Quiz.NextButton = NextButton;
Quiz.Container = Container;
Quiz.Content = Content;

export default Quiz;
