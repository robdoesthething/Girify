import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Banner from './Banner';
import Options from './Options';
import Hints from './Hints';
import NextButton from './NextButton';

import PropTypes from 'prop-types';

const Quiz = ({ children, className }) => {
  /* const { t } = useTheme(); */

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
const Container = ({ children, keyProp }) => {
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
const Content = ({ children }) => {
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

Quiz.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

Container.propTypes = {
  children: PropTypes.node.isRequired,
  keyProp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

Content.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Quiz;
