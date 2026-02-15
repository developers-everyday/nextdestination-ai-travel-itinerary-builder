import React, { useState, useRef } from 'react';
import { useHaptic } from '../../hooks/useHaptic';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeLeftContent?: React.ReactNode;
  swipeRightContent?: React.ReactNode;
  swipeThreshold?: number;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  onPress,
  onSwipeLeft,
  onSwipeRight,
  swipeLeftContent,
  swipeRightContent,
  swipeThreshold = 80,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const haptic = useHaptic();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Limit swipe distance
    const maxOffset = 120;
    const newOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setOffsetX(newOffset);
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);

    if (Math.abs(offsetX) > swipeThreshold) {
      if (offsetX < 0 && onSwipeLeft) {
        await haptic.warning();
        onSwipeLeft();
      } else if (offsetX > 0 && onSwipeRight) {
        await haptic.light();
        onSwipeRight();
      }
    }

    setOffsetX(0);
  };

  const handleClick = async () => {
    if (Math.abs(offsetX) < 10 && onPress) {
      await haptic.light();
      onPress();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe action backgrounds */}
      {swipeLeftContent && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500 text-white">
          {swipeLeftContent}
        </div>
      )}
      {swipeRightContent && (
        <div className="absolute inset-y-0 left-0 flex items-center justify-start px-4 bg-green-500 text-white">
          {swipeRightContent}
        </div>
      )}

      {/* Main card content */}
      <div
        className={`
          relative bg-white shadow-sm
          transition-transform duration-200 ease-out
          ${onPress ? 'cursor-pointer active:bg-slate-50' : ''}
          ${className}
        `}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={(onSwipeLeft || onSwipeRight) ? handleTouchStart : undefined}
        onTouchMove={(onSwipeLeft || onSwipeRight) ? handleTouchMove : undefined}
        onTouchEnd={(onSwipeLeft || onSwipeRight) ? handleTouchEnd : undefined}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
};
