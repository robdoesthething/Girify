import React from 'react';
import PropTypes from 'prop-types';

const UKFlag = ({ className }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="M75 0l75 480h415l-75-480zM0 480l75-480h415l-75 480z" />
    <path fill="#FFF" d="M0 0l640 480h-75L0 75zM640 0L0 480h75l565-405z" />
    <path fill="#C8102E" d="M0 0l640 480h-50L0 25zM640 0L0 480h50l590-440z" />
    <path fill="#FFF" d="M250 0h140v480H250zM0 170h640v140H0z" />
    <path fill="#C8102E" d="M280 0h80v480h-80zM0 200h640v80H0z" />
  </svg>
);

UKFlag.propTypes = {
  className: PropTypes.string,
};

export default UKFlag;
