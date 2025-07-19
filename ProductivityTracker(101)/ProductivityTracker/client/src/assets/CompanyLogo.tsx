import React from 'react';
import logoImage from '@assets/logo.png';

interface CompanyLogoProps {
  className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ className = "h-10 w-auto" }) => {
  return (
    <img 
      src={logoImage}
      alt="شركة المبدعون - Innovators Consulting Engineers"
      className={className}
      title="شركة المبدعون - Innovators Consulting Engineers"
    />
  );
};

export default CompanyLogo;