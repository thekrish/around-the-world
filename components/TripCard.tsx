'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Plane, Car, Train, Users, Tag, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  type: 'ROUND_TRIP' | 'ONE_WAY';
  departureLocation: {
    city: string;
    country: string;
  };
  arrivalLocation: {
    city: string;
    country: string;
  };
  startDate: string;
  endDate: string;
  transport: 'PLANE' | 'CAR' | 'TRAIN' | 'BOAT' | 'WALKING';
  travelers: string[];
  notes?: string;
  attendees?: string[];
  tags?: string[];
}

interface TripCardProps {
  trip: Trip;
  isActive: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const getTransportIcon = (transport: string) => {
  switch (transport) {
    case 'PLANE':
      return <Plane className="w-5 h-5" />;
    case 'CAR':
      return <Car className="w-5 h-5" />;
    case 'TRAIN':
      return <Train className="w-5 h-5" />;
    default:
      return <MapPin className="w-5 h-5" />;
  }
};

const getTravelerColor = (travelers: string[]) => {
  if (travelers.includes('You') && travelers.includes('Celia')) {
    return 'from-purple-500 to-pink-500';
  } else if (travelers.includes('You')) {
    return 'from-blue-500 to-blue-600';
  } else if (travelers.includes('Celia')) {
    return 'from-pink-500 to-pink-600';
  }
  return 'from-gray-500 to-gray-600';
};

export default function TripCard({ trip, isActive, onEdit, onDelete }: TripCardProps) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300
        ${isActive 
          ? 'bg-white/20 border-white/40 shadow-xl scale-105' 
          : 'bg-white/10 border-white/20 hover:bg-white/15'
        }
      `}
    >
      {/* Traveler Indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getTravelerColor(trip.travelers)} rounded-t-2xl`} />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{trip.title}</h3>
          <div className="flex items-center text-white/80 space-x-2">
            <MapPin className="w-4 h-4" />
            <span>
              {trip.type === 'ROUND_TRIP' 
                ? `${trip.departureLocation.city} ↔ ${trip.arrivalLocation.city}`
                : `${trip.departureLocation.city} → ${trip.arrivalLocation.city}`
              }
            </span>
          </div>
          <div className="text-xs text-white/60 mt-1">
            {trip.type === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-white/80">
            {getTransportIcon(trip.transport)}
            <span className="text-sm capitalize">{trip.transport.toLowerCase()}</span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center space-x-1 ml-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                  title="Edit trip"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this trip?')) {
                      onDelete();
                    }
                  }}
                  className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors text-white/60 hover:text-red-400"
                  title="Delete trip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center text-white/70 mb-4 space-x-4">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </span>
        </div>
        <div className="text-sm">
          {duration} day{duration !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Travelers */}
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-4 h-4 text-white/70" />
        <div className="flex flex-wrap gap-1">
          {trip.travelers.map((traveler, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/20 rounded-full text-xs text-white"
            >
              {traveler}
            </span>
          ))}
        </div>
      </div>

      {/* Attendees */}
      {trip.attendees && trip.attendees.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-white/70 text-sm">With:</span>
          <div className="flex flex-wrap gap-1">
            {trip.attendees.map((attendee, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
              >
                {attendee}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {trip.tags && trip.tags.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="w-4 h-4 text-white/70" />
          <div className="flex flex-wrap gap-1">
            {trip.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full text-xs text-white border border-white/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trip.notes && (
        <div className="text-white/80 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
          {trip.notes}
        </div>
      )}

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}