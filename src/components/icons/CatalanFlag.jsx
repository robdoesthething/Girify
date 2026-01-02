import React from 'react';
import PropTypes from 'prop-types';

const CatalanFlag = ({ className }) => (
    <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
        <path fill="#ffed00" d="M0 0h640v480H0z" />
        <path fill="#d50032" d="M0 48h640v48H0zM0 144h640v48H0zM0 240h640v48H0zM0 336h640v48H0z" />
    </svg>
);

CatalanFlag.propTypes = {
    className: PropTypes.string
};

export default CatalanFlag;
