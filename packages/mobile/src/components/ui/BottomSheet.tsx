import React, { useEffect, useRef, useState } from 'react';
import { useHaptic } from '../../hooks/useHaptic';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights as percentages (e.g., [50, 90])
  initialSnapPoint?: number;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  initialSnapPoint = 0,
  showHandle = true,
}) => {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapPoint);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const haptic = useHaptic();

  const currentHeight = snapPoints[currentSnapIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnapPoint);
      setDragOffset(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnapPoint]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    setDragOffset(Math.max(0, diff));
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);

    if (dragOffset > 100) {
      // Check if we can snap to a lower point
      if (currentSnapIndex > 0) {
        await haptic.light();
        setCurrentSnapIndex(currentSnapIndex - 1);
      } else {
        await haptic.light();
        onClose();
      }
    } else if (dragOffset < -50 && currentSnapIndex < snapPoints.length - 1) {
      // Snap to higher point
      await haptic.light();
      setCurrentSnapIndex(currentSnapIndex + 1);
    }

    setDragOffset(0);
  };

  const handleBackdropClick = () => {
    haptic.light();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300 ease-out"
        style={{
          height: `${currentHeight}vh`,
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, height 0.3s ease-out',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};
