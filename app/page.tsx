'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LeafletMap from '../components/LeafletMap';
import TripCard from '../components/TripCard';
import TimelineControls from '../components/TimelineControls';
import AddTripModal from '../components/AddTripModal';
import { Plus, Globe } from 'lucide-react';

// Sample data for demonstration using new trip model
const sampleTrips = [
  {
    id: '1',
    title: 'Vegas Weekend',
    type: 'ROUND_TRIP' as const,
    departureLocation: {
      id: '1',
      name: 'Los Angeles',
      city: 'Los Angeles',
      country: 'United States',
      latitude: 34.0522,
      longitude: -118.2437
    },
    arrivalLocation: {
      id: '2',
      name: 'Las Vegas',
      city: 'Las Vegas',
      country: 'United States',
      latitude: 36.1699,
      longitude: -115.1398
    },
    startDate: '2024-02-16',
    endDate: '2024-02-18',
    transport: 'PLANE' as const,
    travelers: ['You', 'Celia'],
    notes: 'Amazing weekend on the Strip! Saw Cirque du Soleil and won big at blackjack 🎰',
    attendees: ['Sarah', 'Mike'],
    tags: ['vacation', 'birthday'],
    order: 1
  },
  {
    id: '2',
    title: 'Thanksgiving in Houston',
    type: 'ONE_WAY' as const,
    departureLocation: {
      id: '1',
      name: 'Los Angeles',
      city: 'Los Angeles',
      country: 'United States',
      latitude: 34.0522,
      longitude: -118.2437
    },
    arrivalLocation: {
      id: '3',
      name: 'Houston',
      city: 'Houston',
      country: 'United States',
      latitude: 29.7604,
      longitude: -95.3698
    },
    startDate: '2024-11-21',
    endDate: '2024-11-25',
    transport: 'PLANE' as const,
    travelers: ['You', 'Celia'],
    notes: 'Family Thanksgiving - amazing food and quality time with everyone',
    attendees: ['Mom', 'Dad', 'Sister', 'Grandma'],
    tags: ['family', 'holiday'],
    order: 2
  }
];

export default function Home() {
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trips, setTrips] = useState(sampleTrips);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTripIndex < trips.length - 1) {
      interval = setInterval(() => {
        setCurrentTripIndex(prev => {
          if (prev >= trips.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTripIndex, trips.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTripIndex, trips.length]);

  const handleNext = () => {
    if (currentTripIndex < trips.length - 1) {
      setCurrentTripIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTripIndex > 0) {
      setCurrentTripIndex(prev => prev - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTripIndex(0);
    setIsPlaying(false);
  };

  const handleLocationClick = (coordinates: [number, number]) => {
    console.log('Clicked location:', coordinates);
  };

  const handleAddTrip = (newTripData: Omit<typeof sampleTrips[0], 'id' | 'order'>) => {
    const newTrip = {
      ...newTripData,
      id: `trip-${Date.now()}`,
      order: trips.length + 1,
    };
    
    setTrips(prev => [...prev, newTrip]);
    
    // Set the new trip as current
    setCurrentTripIndex(trips.length);
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(prev => {
      const filtered = prev.filter(trip => trip.id !== tripId);
      // Update order numbers
      return filtered.map((trip, index) => ({
        ...trip,
        order: index + 1
      }));
    });
    
    // Adjust current index if needed
    if (currentTripIndex >= trips.length - 1) {
      setCurrentTripIndex(Math.max(0, trips.length - 2));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Globe className="w-8 h-8 text-white" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Around the World
            </h1>
          </div>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Track your journeys and relive your adventures across the globe
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Map Section */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="h-96 lg:h-[500px]">
              <LeafletMap
                trips={trips}
                currentTripIndex={currentTripIndex}
                onLocationClick={handleLocationClick}
              />
            </div>
            
            <TimelineControls
              currentIndex={currentTripIndex}
              totalTrips={trips.length}
              isPlaying={isPlaying}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
            />
          </motion.div>

          {/* Trip Details Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Add Trip Button */}
            <motion.button
              onClick={() => setIsAddTripModalOpen(true)}
              className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl text-white font-semibold flex items-center justify-center space-x-2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span>Add New Trip</span>
            </motion.button>

            {/* Current Trip Card */}
            {trips[currentTripIndex] && (
              <TripCard 
                trip={trips[currentTripIndex]} 
                isActive={true}
                onEdit={() => {
                  // TODO: Implement edit functionality
                  alert('Edit functionality coming soon!');
                }}
                onDelete={() => handleDeleteTrip(trips[currentTripIndex].id)}
              />
            )}

            {/* Trip List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="text-white font-semibold text-lg mb-3">All Trips</h3>
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  className={`cursor-pointer transition-all ${
                    index === currentTripIndex ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setCurrentTripIndex(index)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium text-sm">{trip.title}</h4>
                        <p className="text-white/70 text-xs">
                          {trip.type === 'ROUND_TRIP' 
                            ? `${trip.departureLocation.city} ↔ ${trip.arrivalLocation.city}`
                            : `${trip.departureLocation.city} → ${trip.arrivalLocation.city}`
                          }
                        </p>
                      </div>
                      <div className="text-white/60 text-xs">
                        {new Date(trip.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={isAddTripModalOpen}
        onClose={() => setIsAddTripModalOpen(false)}
        onAddTrip={handleAddTrip}
      />
    </div>
  );
}