import React, { useState } from 'react';
import { Plane, Calendar, Clock, Search, ArrowRight } from 'lucide-react';
import { BottomSheet, MobileButton, MobileInput } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { ItineraryItem } from '@nextdestination/shared';

interface FlightSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFlight: (flight: ItineraryItem) => void;
  type: 'arrival' | 'departure';
  destination: string;
}

export const FlightSearchSheet: React.FC<FlightSearchSheetProps> = ({
  isOpen,
  onClose,
  onAddFlight,
  type,
  destination,
}) => {
  const haptic = useHaptic();
  const [flightNumber, setFlightNumber] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [airline, setAirline] = useState('');

  // Pre-fill based on type
  React.useEffect(() => {
    if (type === 'arrival') {
      setArrivalCity(destination);
    } else {
      setDepartureCity(destination);
    }
  }, [type, destination]);

  const handleAddFlight = async () => {
    if (!flightNumber || !departureTime) {
      await haptic.error();
      return;
    }

    await haptic.success();

    const flightActivity: ItineraryItem = {
      time: type === 'arrival' ? arrivalTime || departureTime : departureTime,
      activity: `${type === 'arrival' ? 'Arrive' : 'Depart'}: ${airline || ''} ${flightNumber}`.trim(),
      location: type === 'arrival' ? `${departureCity} → ${arrivalCity}` : `${departureCity} → ${arrivalCity}`,
      description: `Flight ${flightNumber}${airline ? ` operated by ${airline}` : ''}. Departs ${departureTime}${arrivalTime ? `, arrives ${arrivalTime}` : ''}.`,
      type: 'flight',
    };

    onAddFlight(flightActivity);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFlightNumber('');
    setDepartureCity('');
    setArrivalCity('');
    setDepartureTime('');
    setArrivalTime('');
    setAirline('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={type === 'arrival' ? 'Add Arrival Flight' : 'Add Departure Flight'}
      snapPoints={[75, 90]}
    >
      <div className="space-y-4">
        {/* Flight Header */}
        <div className="flex items-center justify-center gap-4 py-4 bg-blue-50 rounded-xl">
          <div className="text-center">
            <p className="text-xs text-slate-500">From</p>
            <p className="font-bold text-slate-900">
              {type === 'arrival' ? (departureCity || 'Origin') : (departureCity || destination)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-8 h-px bg-blue-300" />
            <Plane className="w-5 h-5" />
            <div className="w-8 h-px bg-blue-300" />
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">To</p>
            <p className="font-bold text-slate-900">
              {type === 'arrival' ? (arrivalCity || destination) : (arrivalCity || 'Destination')}
            </p>
          </div>
        </div>

        {/* Flight Number & Airline */}
        <div className="grid grid-cols-2 gap-3">
          <MobileInput
            label="Flight Number"
            placeholder="e.g., AA123"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
          />
          <MobileInput
            label="Airline (Optional)"
            placeholder="e.g., American"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
          />
        </div>

        {/* Cities */}
        <div className="grid grid-cols-2 gap-3">
          <MobileInput
            label="From"
            placeholder="City or airport"
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
          />
          <MobileInput
            label="To"
            placeholder="City or airport"
            value={arrivalCity}
            onChange={(e) => setArrivalCity(e.target.value)}
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Departure Time
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Clock className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="bg-transparent outline-none text-slate-900 flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Arrival Time
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Clock className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="bg-transparent outline-none text-slate-900 flex-1"
              />
            </div>
          </div>
        </div>

        {/* Add Button */}
        <MobileButton
          fullWidth
          onClick={handleAddFlight}
          disabled={!flightNumber || !departureTime}
          icon={<Plane className="w-5 h-5" />}
        >
          Add Flight
        </MobileButton>
      </div>
    </BottomSheet>
  );
};
