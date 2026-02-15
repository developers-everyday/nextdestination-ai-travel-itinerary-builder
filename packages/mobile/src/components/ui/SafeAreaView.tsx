import React from 'react';

interface SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  className = '',
  edges = ['top', 'bottom'],
}) => {
  const paddingClasses = edges
    .map((edge) => {
      switch (edge) {
        case 'top':
          return 'pt-safe';
        case 'bottom':
          return 'pb-safe';
        case 'left':
          return 'pl-safe';
        case 'right':
          return 'pr-safe';
        default:
          return '';
      }
    })
    .join(' ');

  return (
    <div className={`${paddingClasses} ${className}`}>
      {children}
    </div>
  );
};
