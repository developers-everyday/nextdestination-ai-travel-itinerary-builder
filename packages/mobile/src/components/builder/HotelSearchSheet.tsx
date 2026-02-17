import React, { useState } from 'react';
import { Building2, MapPin, Star, Search, Calendar, Users } from 'lucide-react';
import { BottomSheet, MobileButton, MobileInput, MobileCard } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { ItineraryItem } from '@nextdestination/shared';

interface HotelSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHotel: (hotel: ItineraryItem) => void;
  destination: string;
  dayNumber: number;
}

// Mock hotel data - in real app would come from API
const MOCK_HOTELS = [
  {
    id: '1',
    name: 'Grand Hotel Central',
    rating: 4.8,
    price: '$250',
    location: 'City Center',
    image: '🏨',
  },
  {
    id: '2',
    name: 'Boutique Inn',
    rating: 4.5,
    price: '$180',
    location: 'Old Town',
    image: '🏩',
  },
  {
    id: '3',
    name: 'Luxury Suites',
    rating: 4.9,
    price: '$450',
    location: 'Waterfront',
    image: '🏰',
  },
];

export const HotelSearchSheet: React.FC<HotelSearchSheetProps> = ({
  isOpen,
  onClose,
  onAddHotel,
  destination,
  dayNumber,
}) => {
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHotel, setManualHotel] = useState({
    name: '',
    location: '',
    checkIn: '15:00',
    notes: '',
  });

  const filteredHotels = MOCK_HOTELS.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectHotel = async (hotel: typeof MOCK_HOTELS[0]) => {
    await haptic.success();

    const hotelActivity: ItineraryItem = {
      time: '15:00',
      activity: `Check-in: ${hotel.name}`,
      location: `${hotel.location}, ${destination}`,
      description: `${hotel.rating} star hotel. ${hotel.price}/night.`,
      type: 'hotel',
    };

    onAddHotel(hotelActivity);
    onClose();
  };

  const handleAddManual = async () => {
    if (!manualHotel.name) {
      await haptic.error();
      return;
    }

    await haptic.success();

    const hotelActivity: ItineraryItem = {
      time: manualHotel.checkIn,
      activity: `Check-in: ${manualHotel.name}`,
      location: manualHotel.location || destination,
      description: manualHotel.notes || `Hotel accommodation for Day ${dayNumber}`,
      type: 'hotel',
    };

    onAddHotel(hotelActivity);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setManualHotel({ name: '', location: '', checkIn: '15:00', notes: '' });
    setShowManualForm(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Hotel - Day ${dayNumber}`}
      snapPoints={[70, 90]}
    >
      {showManualForm ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={() => setShowManualForm(false)}
            className="text-sm text-blue-600 font-medium"
          >
            ← Back to search
          </button>

          <MobileInput
            label="Hotel Name"
            placeholder="e.g., Hilton Garden Inn"
            value={manualHotel.name}
            onChange={(e) =>
              setManualHotel((prev) => ({ ...prev, name: e.target.value }))
            }
            leftIcon={<Building2 className="w-5 h-5" />}
          />

          <MobileInput
            label="Location / Address"
            placeholder="e.g., 123 Main Street"
            value={manualHotel.location}
            onChange={(e) =>
              setManualHotel((prev) => ({ ...prev, location: e.target.value }))
            }
            leftIcon={<MapPin className="w-5 h-5" />}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Check-in Time
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Calendar className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="time"
                value={manualHotel.checkIn}
                onChange={(e) =>
                  setManualHotel((prev) => ({ ...prev, checkIn: e.target.value }))
                }
                className="bg-transparent outline-none text-slate-900 flex-1"
              />
            </div>
          </div>

          <MobileInput
            label="Notes (Optional)"
            placeholder="Confirmation number, room type, etc."
            value={manualHotel.notes}
            onChange={(e) =>
              setManualHotel((prev) => ({ ...prev, notes: e.target.value }))
            }
          />

          <MobileButton
            fullWidth
            onClick={handleAddManual}
            disabled={!manualHotel.name}
            icon={<Building2 className="w-5 h-5" />}
          >
            Add Hotel
          </MobileButton>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder={`Search hotels in ${destination}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Hotel Results */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {filteredHotels.map((hotel) => (
              <MobileCard
                key={hotel.id}
                onPress={() => handleSelectHotel(hotel)}
                className="p-4 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                    {hotel.image}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{hotel.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {hotel.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-sm font-medium">{hotel.rating}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{hotel.price}</p>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>

          {/* Manual Entry */}
          <div className="pt-2 border-t border-slate-100">
            <MobileButton
              variant="secondary"
              fullWidth
              onClick={() => setShowManualForm(true)}
            >
              Enter Hotel Manually
            </MobileButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
