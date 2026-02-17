import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, Trash2, X } from 'lucide-react';
import { BottomSheet, MobileButton, MobileInput } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { ItineraryItem } from '@nextdestination/shared';

interface ActivityEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ItineraryItem | null;
  activityIndex: number;
  onSave: (updates: Partial<ItineraryItem>) => void;
  onDelete: () => void;
}

export const ActivityEditSheet: React.FC<ActivityEditSheetProps> = ({
  isOpen,
  onClose,
  activity,
  activityIndex,
  onSave,
  onDelete,
}) => {
  const haptic = useHaptic();
  const [editedActivity, setEditedActivity] = useState({
    activity: '',
    location: '',
    time: '',
    description: '',
  });

  useEffect(() => {
    if (activity) {
      setEditedActivity({
        activity: activity.activity || '',
        location: activity.location || '',
        time: activity.time || '',
        description: activity.description || '',
      });
    }
  }, [activity]);

  const handleSave = async () => {
    if (!editedActivity.activity) {
      await haptic.error();
      return;
    }

    await haptic.success();
    onSave({
      activity: editedActivity.activity,
      location: editedActivity.location,
      time: editedActivity.time,
      description: editedActivity.description,
    });
    onClose();
  };

  const handleDelete = async () => {
    await haptic.warning();
    onDelete();
    onClose();
  };

  if (!activity) return null;

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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Activity ${activityIndex + 1}`}
      snapPoints={[70, 90]}
    >
      <div className="space-y-4">
        {/* Activity Type Badge */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <span className="text-2xl">{getActivityIcon()}</span>
          <div>
            <p className="text-sm text-slate-500">Activity Type</p>
            <p className="font-medium text-slate-900 capitalize">
              {activity.type || 'Activity'}
            </p>
          </div>
        </div>

        {/* Activity Name */}
        <MobileInput
          label="Activity Name"
          placeholder="What are you doing?"
          value={editedActivity.activity}
          onChange={(e) =>
            setEditedActivity((prev) => ({ ...prev, activity: e.target.value }))
          }
        />

        {/* Location */}
        <MobileInput
          label="Location"
          placeholder="Where is this?"
          value={editedActivity.location}
          onChange={(e) =>
            setEditedActivity((prev) => ({ ...prev, location: e.target.value }))
          }
          leftIcon={<MapPin className="w-5 h-5" />}
        />

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Time
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
            <Clock className="w-5 h-5 text-slate-400 mr-2" />
            <input
              type="time"
              value={editedActivity.time}
              onChange={(e) =>
                setEditedActivity((prev) => ({ ...prev, time: e.target.value }))
              }
              className="bg-transparent outline-none text-slate-900 flex-1"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description / Notes
          </label>
          <textarea
            value={editedActivity.description}
            onChange={(e) =>
              setEditedActivity((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Add any notes..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <MobileButton
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 className="w-5 h-5" />}
            className="flex-1"
          >
            Delete
          </MobileButton>
          <MobileButton
            onClick={handleSave}
            className="flex-2"
            fullWidth
          >
            Save Changes
          </MobileButton>
        </div>
      </div>
    </BottomSheet>
  );
};
