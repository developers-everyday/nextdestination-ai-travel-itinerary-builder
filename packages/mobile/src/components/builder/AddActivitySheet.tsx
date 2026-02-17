import React, { useState } from 'react';
import { Search, MapPin, Clock, X } from 'lucide-react';
import { BottomSheet, MobileButton, MobileInput } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { ItineraryItem } from '@nextdestination/shared';

interface AddActivitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activity: ItineraryItem) => void;
  onAddFlight?: (type: 'arrival' | 'departure') => void;
  onAddHotel?: () => void;
  destination: string;
}

const QUICK_ADD_OPTIONS = [
  { type: 'restaurant', emoji: '🍽️', label: 'Restaurant' },
  { type: 'attraction', emoji: '🏛️', label: 'Attraction' },
  { type: 'activity', emoji: '🎯', label: 'Activity' },
  { type: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { type: 'transport', emoji: '🚕', label: 'Transport' },
  { type: 'other', emoji: '📍', label: 'Other' },
];

export const AddActivitySheet: React.FC<AddActivitySheetProps> = ({
  isOpen,
  onClose,
  onAddActivity,
  onAddFlight,
  onAddHotel,
  destination,
}) => {
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualActivity, setManualActivity] = useState({
    name: '',
    location: '',
    time: '09:00',
    description: '',
  });

  const handleQuickAdd = async (type: string) => {
    await haptic.light();
    setShowManualForm(true);
    setManualActivity((prev) => ({
      ...prev,
      name: `New ${type}`,
    }));
  };

  const handleSearch = async () => {
    await haptic.light();
    // Would integrate with Google Places API here
    console.log('Searching for:', searchQuery);
  };

  const handleAddManual = async () => {
    if (!manualActivity.name) {
      await haptic.error();
      return;
    }

    await haptic.success();
    onAddActivity({
      time: manualActivity.time,
      activity: manualActivity.name,
      location: manualActivity.location || destination,
      description: manualActivity.description,
      type: 'activity',
    });

    // Reset form
    setManualActivity({ name: '', location: '', time: '09:00', description: '' });
    setShowManualForm(false);
    onClose();
  };

  const handleClose = () => {
    setShowManualForm(false);
    setSearchQuery('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Activity"
      snapPoints={[70, 90]}
    >
      {showManualForm ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={() => setShowManualForm(false)}
            className="flex items-center text-sm text-blue-600 font-medium mb-2"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>

          {/* Manual Form */}
          <MobileInput
            label="Activity Name"
            placeholder="e.g., Visit Eiffel Tower"
            value={manualActivity.name}
            onChange={(e) =>
              setManualActivity((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <MobileInput
            label="Location"
            placeholder="e.g., Champ de Mars"
            value={manualActivity.location}
            onChange={(e) =>
              setManualActivity((prev) => ({ ...prev, location: e.target.value }))
            }
            leftIcon={<MapPin className="w-5 h-5" />}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Time
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Clock className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="time"
                value={manualActivity.time}
                onChange={(e) =>
                  setManualActivity((prev) => ({ ...prev, time: e.target.value }))
                }
                className="bg-transparent outline-none text-slate-900 flex-1"
              />
            </div>
          </div>

          <MobileInput
            label="Description (Optional)"
            placeholder="Add notes..."
            value={manualActivity.description}
            onChange={(e) =>
              setManualActivity((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <MobileButton fullWidth onClick={handleAddManual}>
            Add Activity
          </MobileButton>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder={`Search places in ${destination}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Travel Options */}
          {(onAddFlight || onAddHotel) && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Travel</h3>
              <div className="grid grid-cols-3 gap-3">
                {onAddFlight && (
                  <>
                    <button
                      onClick={() => onAddFlight('arrival')}
                      className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-2xl mb-1">✈️</span>
                      <span className="text-sm text-blue-600">Arrival</span>
                    </button>
                    <button
                      onClick={() => onAddFlight('departure')}
                      className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-2xl mb-1">🛫</span>
                      <span className="text-sm text-blue-600">Departure</span>
                    </button>
                  </>
                )}
                {onAddHotel && (
                  <button
                    onClick={onAddHotel}
                    className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-2xl mb-1">🏨</span>
                    <span className="text-sm text-purple-600">Hotel</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Add Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">Quick Add</h3>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_ADD_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleQuickAdd(option.type)}
                  className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <span className="text-2xl mb-1">{option.emoji}</span>
                  <span className="text-sm text-slate-600">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Entry Button */}
          <MobileButton
            variant="secondary"
            fullWidth
            onClick={() => setShowManualForm(true)}
          >
            Enter Manually
          </MobileButton>
        </div>
      )}
    </BottomSheet>
  );
};
