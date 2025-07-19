import React from 'react';
import logoImage from '../../assets/logo-innovators.png';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "h-auto w-full", 
  width = 200, 
  height = 100 
}) => {
  return (
    <img 
      src={logoImage} 
      alt="شركة المبدعون - Innovators Consulting Engineers" 
      className={className}
      width={width}
      height={height}
    />
  );
};

export default Logo;