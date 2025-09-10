'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Car, MapPin } from 'lucide-react';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-110m.json";

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Trip {
  id: string;
  title: string;
  location: Location;
  startDate: string;
  endDate: string;
  transport: 'PLANE' | 'CAR' | 'TRAIN' | 'BOAT' | 'WALKING';
  travelers: string[];
  notes?: string;
  order: number;
}

interface WorldMapProps {
  trips: Trip[];
  currentTripIndex: number;
  onLocationClick: (coordinates: [number, number]) => void;
}

const getTransportIcon = (transport: string) => {
  switch (transport) {
    case 'PLANE':
      return <Plane className="w-4 h-4" />;
    case 'CAR':
      return <Car className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

const getTravelerColor = (travelers: string[]) => {
  if (travelers.includes('You') && travelers.includes('Celia')) {
    return '#8B5CF6'; // Purple for together
  } else if (travelers.includes('You')) {
    return '#3B82F6'; // Blue for you
  } else if (travelers.includes('Celia')) {
    return '#EC4899'; // Pink for Celia
  }
  return '#6B7280'; // Gray for others
};

export default function WorldMap({ trips, currentTripIndex, onLocationClick }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const visibleTrips = trips.slice(0, currentTripIndex + 1);
  const currentTrip = trips[currentTripIndex];

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden shadow-lg">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 147,
          center: [0, 0],
        }}
        width={800}
        height={400}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={() => setHoveredCountry(geo.properties.NAME)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{
                  default: {
                    fill: hoveredCountry === geo.properties.NAME ? "#E5E7EB" : "#F3F4F6",
                    outline: "none",
                    stroke: "#D1D5DB",
                    strokeWidth: 0.5,
                  },
                  hover: {
                    fill: "#E5E7EB",
                    outline: "none",
                    stroke: "#9CA3AF",
                    strokeWidth: 1,
                  },
                  pressed: {
                    fill: "#D1D5DB",
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>

        {/* Journey Lines */}
        <AnimatePresence>
          {visibleTrips.map((trip, index) => {
            if (index === 0) return null;
            const prevTrip = visibleTrips[index - 1];
            const startCoord: [number, number] = [prevTrip.location.longitude, prevTrip.location.latitude];
            const endCoord: [number, number] = [trip.location.longitude, trip.location.latitude];
            
            return (
              <motion.g
                key={`line-${trip.id}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 1, delay: index * 0.3 }}
              >
                <Line
                  from={startCoord}
                  to={endCoord}
                  stroke={getTravelerColor(trip.travelers)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="4,4"
                />
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Location Markers */}
        {visibleTrips.map((trip, index) => (
          <Marker
            key={trip.id}
            coordinates={[trip.location.longitude, trip.location.latitude]}
          >
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <circle
                r={index === currentTripIndex ? 8 : 6}
                fill={getTravelerColor(trip.travelers)}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer hover:scale-110 transition-transform"
                onClick={() => onLocationClick([trip.location.longitude, trip.location.latitude])}
              />
              {index === currentTripIndex && (
                <motion.circle
                  r={12}
                  fill="none"
                  stroke={getTravelerColor(trip.travelers)}
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </motion.g>
          </Marker>
        ))}

        {/* Current Trip Animation */}
        <AnimatePresence>
          {currentTrip && (
            <Marker coordinates={[currentTrip.location.longitude, currentTrip.location.latitude]}>
              <motion.g
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: -30, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <rect
                  x={-25}
                  y={-15}
                  width={50}
                  height={30}
                  fill="white"
                  stroke={getTravelerColor(currentTrip.travelers)}
                  strokeWidth={2}
                  rx={8}
                  className="drop-shadow-lg"
                />
                <text
                  textAnchor="middle"
                  y={-2}
                  className="text-xs font-semibold fill-gray-800"
                >
                  {currentTrip.location.city}
                </text>
                <text
                  textAnchor="middle"
                  y={10}
                  className="text-xs fill-gray-600"
                >
                  {new Date(currentTrip.startDate).toLocaleDateString()}
                </text>
              </motion.g>
            </Marker>
          )}
        </AnimatePresence>
      </ComposableMap>
    </div>
  );
}