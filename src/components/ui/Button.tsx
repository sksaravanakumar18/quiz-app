import React from 'react';

// Basic Button without Tailwind - relies on browser defaults or custom CSS
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // You can add custom classNames via props if needed for component CSS 
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'outline' | 'success' | 'link'; // whatever variants you support
  size?: 'sm' | 'md';
}

const Button: React.FC<ButtonProps> = ({ 
  children,
  className = '', // Keep className prop for potential custom CSS
  ...props
}) => {
  // No Tailwind classes applied here directly
  return (
    <button
      className={`basic-button ${className}`} // Add a base class if you want to target it in CSS
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;