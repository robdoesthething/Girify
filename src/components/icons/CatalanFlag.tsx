import React from 'react';

interface CatalanFlagProps {
  className?: string;
}

const CatalanFlag: React.FC<CatalanFlagProps> = ({ className }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#ffed00" d="M0 0h640v480H0z" />
    <path fill="#d50032" d="M0 48h640v48H0zM0 144h640v48H0zM0 240h640v48H0zM0 336h640v48H0z" />
  </svg>
);

export default CatalanFlag;
