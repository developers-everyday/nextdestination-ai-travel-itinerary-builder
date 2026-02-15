import React from 'react';
import { Plus } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { DayPlan } from '@nextdestination/shared';

interface DaySelectorProps {
  days: DayPlan[];
  activeDay: number;
  onDaySelect: (day: number) => void;
  onAddDay: () => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  activeDay,
  onDaySelect,
  onAddDay,
}) => {
  const haptic = useHaptic();

  const handleDaySelect = async (day: number) => {
    await haptic.light();
    onDaySelect(day);
  };

  const handleAddDay = async () => {
    await haptic.medium();
    onAddDay();
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 bg-white border-b border-slate-100">
      {days.map((day) => (
        <button
          key={day.day}
          onClick={() => handleDaySelect(day.day)}
          className={`flex flex-col items-center min-w-[60px] px-3 py-2 rounded-xl transition-all ${
            activeDay === day.day
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <span className="text-xs font-medium">Day</span>
          <span className="text-lg font-bold">{day.day}</span>
        </button>
      ))}
      <button
        onClick={handleAddDay}
        className="flex items-center justify-center min-w-[60px] px-3 py-2 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 text-slate-400"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};
