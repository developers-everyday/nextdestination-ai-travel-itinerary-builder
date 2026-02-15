import React from 'react';
import { Clock, MapPin, GripVertical, Trash2 } from 'lucide-react';
import { ItineraryItem } from '@nextdestination/shared';
import { MobileCard } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';

interface ActivityCardProps {
  activity: ItineraryItem;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  onPress,
  onDelete,
  isDragging = false,
}) => {
  const haptic = useHaptic();

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      default:
        return '📍';
    }
  };

  const handleDelete = async () => {
    await haptic.warning();
    onDelete();
  };

  return (
    <MobileCard
      onPress={onPress}
      onSwipeLeft={handleDelete}
      swipeLeftContent={
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <span>Delete</span>
        </div>
      }
      className={`rounded-xl transition-all ${
        isDragging ? 'shadow-lg scale-105 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start p-4 gap-3">
        {/* Drag Handle */}
        <div className="pt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-slate-300" />
        </div>

        {/* Activity Icon */}
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0">
          {getActivityIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{activity.activity}</h4>

          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {activity.time}
            </div>
            {activity.location && (
              <div className="flex items-center truncate">
                <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span className="truncate">{activity.location}</span>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
        </div>

        {/* Index Badge */}
        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-500">
          {index + 1}
        </div>
      </div>
    </MobileCard>
  );
};
