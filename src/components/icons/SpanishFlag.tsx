import React from 'react';

interface SpanishFlagProps {
  className?: string;
}

const SpanishFlag: React.FC<SpanishFlagProps> = ({ className }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#aa151b" d="M0 0h640v480H0z" />
    <path fill="#f1bf00" d="M0 120h640v240H0z" />
  </svg>
);

export default SpanishFlag;
