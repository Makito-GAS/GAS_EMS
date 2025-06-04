import React from 'react';
import './AnimatedLogo.css';

const AnimatedLogo = ({ isVisible = true }) => {
  if (!isVisible) return null;
  
  return (
    <div className="animated-logo">
      <div className="gas-logo">
        <div className="neon-text">GAS</div>
        <div className="rainbow-line"></div>
        <div className="school-name">GRACE ARTISAN SCHOOL</div>
      </div>
    </div>
  );
};

export default AnimatedLogo; 