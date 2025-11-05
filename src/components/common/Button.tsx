import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}) => {
  // 기본 스타일
  const baseStyles = 'rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md active:scale-95';

  // 크기별 스타일
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // variant별 스타일
  const variantStyles = {
    primary: 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:-translate-y-0.5',
    secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5',
    ghost: 'text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:-translate-y-0.5',
    danger: 'text-red-600 bg-white border border-red-600 hover:bg-red-50 hover:border-red-700 hover:-translate-y-0.5',
  };

  // disabled 스타일
  const disabledStyles = 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-sm';

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${(disabled || loading) ? disabledStyles : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClassName}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
