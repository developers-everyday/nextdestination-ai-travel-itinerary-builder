import React, { forwardRef, useState } from 'react';
import { useKeyboard } from '../../hooks/useKeyboard';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}

        <div
          className={`
            relative flex items-center rounded-xl border-2 transition-colors
            ${isFocused ? 'border-blue-500 bg-white' : 'border-slate-200 bg-slate-50'}
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          {leftIcon && (
            <div className="pl-3 text-slate-400">{leftIcon}</div>
          )}

          <input
            ref={ref}
            className={`
              flex-1 px-3 py-3 bg-transparent outline-none text-slate-900 placeholder:text-slate-400
              ${leftIcon ? 'pl-2' : ''}
              ${rightIcon ? 'pr-2' : ''}
              ${className}
            `}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="pr-3 text-slate-400 hover:text-slate-600"
            >
              {rightIcon}
            </button>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={`mt-1.5 text-sm ${
              error ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';
