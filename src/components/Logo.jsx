import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/girify-logo.png';
import logoDark from '../assets/girify-logo-dark.png';
import PropTypes from 'prop-types';

const Logo = ({ className }) => {
  const { theme } = useTheme();

  return (
    <img
      src={theme === 'dark' ? logoDark : logoImage}
      alt="Girify"
      className={`${className || ''}`}
    />
  );
};

Logo.propTypes = {
  className: PropTypes.string,
};

export default Logo;
