'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Car, MapPin } from 'lucide-react';

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

interface SimpleWorldMapProps {
  trips: Trip[];
  currentTripIndex: number;
  onLocationClick: (coordinates: [number, number]) => void;
}

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

// Convert lat/lng to SVG coordinates
const projectCoordinates = (longitude: number, latitude: number, width: number, height: number) => {
  // Simple equirectangular projection
  const x = ((longitude + 180) / 360) * width;
  const y = ((90 - latitude) / 180) * height;
  return [x, y];
};

export default function SimpleWorldMap({ trips, currentTripIndex, onLocationClick }: SimpleWorldMapProps) {
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  
  const mapWidth = 800;
  const mapHeight = 400;
  const visibleTrips = trips.slice(0, currentTripIndex + 1);
  const currentTrip = trips[currentTripIndex];

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden shadow-lg relative">
      <svg
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="w-full h-full"
      >
        {/* Simple world outline */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        
        {/* Background */}
        <rect width={mapWidth} height={mapHeight} fill="#F8FAFC" />
        <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />
        
        {/* Simplified continent outlines */}
        <g stroke="#D1D5DB" strokeWidth="1" fill="#F3F4F6">
          {/* North America */}
          <path d="M 50 80 Q 80 60 120 70 Q 160 75 180 90 Q 200 120 180 150 Q 140 160 100 140 Q 70 120 50 80 Z" />
          
          {/* South America */}
          <path d="M 160 200 Q 180 180 200 190 Q 210 220 205 260 Q 200 300 180 320 Q 160 310 150 280 Q 155 240 160 200 Z" />
          
          {/* Europe */}
          <path d="M 380 70 Q 420 65 450 80 Q 460 100 440 110 Q 400 115 380 100 Q 370 85 380 70 Z" />
          
          {/* Africa */}
          <path d="M 400 120 Q 430 115 450 130 Q 460 160 455 200 Q 450 240 430 260 Q 410 255 395 230 Q 390 180 400 120 Z" />
          
          {/* Asia */}
          <path d="M 480 60 Q 550 55 620 70 Q 680 80 720 90 Q 740 110 720 130 Q 680 135 620 125 Q 550 120 480 110 Q 460 85 480 60 Z" />
          
          {/* Australia */}
          <path d="M 650 280 Q 680 275 710 285 Q 720 300 700 310 Q 670 315 650 305 Q 640 292 650 280 Z" />
        </g>
        
        {/* Journey Lines */}
        <AnimatePresence>
          {visibleTrips.map((trip, index) => {
            if (index === 0) return null;
            const prevTrip = visibleTrips[index - 1];
            const [startX, startY] = projectCoordinates(
              prevTrip.location.longitude, 
              prevTrip.location.latitude, 
              mapWidth, 
              mapHeight
            );
            const [endX, endY] = projectCoordinates(
              trip.location.longitude, 
              trip.location.latitude, 
              mapWidth, 
              mapHeight
            );
            
            return (
              <motion.line
                key={`line-${trip.id}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={getTravelerColor(trip.travelers)}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="6,4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 1.5, delay: index * 0.3 }}
              />
            );
          })}
        </AnimatePresence>

        {/* Location Markers */}
        {visibleTrips.map((trip, index) => {
          const [x, y] = projectCoordinates(
            trip.location.longitude, 
            trip.location.latitude, 
            mapWidth, 
            mapHeight
          );
          
          return (
            <g key={trip.id}>
              <motion.circle
                cx={x}
                cy={y}
                r={index === currentTripIndex ? 12 : 8}
                fill={getTravelerColor(trip.travelers)}
                stroke="white"
                strokeWidth={3}
                className="cursor-pointer hover:scale-110 transition-transform drop-shadow-md"
                onClick={() => onLocationClick([trip.location.longitude, trip.location.latitude])}
                onMouseEnter={() => setHoveredTrip(trip.id)}
                onMouseLeave={() => setHoveredTrip(null)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2, type: "spring", stiffness: 200 }}
              />
              
              {/* Pulsing ring for current trip */}
              {index === currentTripIndex && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={20}
                  fill="none"
                  stroke={getTravelerColor(trip.travelers)}
                  strokeWidth={2}
                  opacity={0.6}
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Transport icon */}
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 + 0.5 }}
              >
                {trip.transport === 'PLANE' && (
                  <g transform={`translate(${x - 6}, ${y - 25})`}>
                    <rect x="0" y="0" width="12" height="12" fill="white" rx="2" opacity="0.9" />
                    <Plane className="w-3 h-3" style={{ x: 1.5, y: 1.5 }} />
                  </g>
                )}
                {trip.transport === 'CAR' && (
                  <g transform={`translate(${x - 6}, ${y - 25})`}>
                    <rect x="0" y="0" width="12" height="12" fill="white" rx="2" opacity="0.9" />
                    <Car className="w-3 h-3" style={{ x: 1.5, y: 1.5 }} />
                  </g>
                )}
              </motion.g>
            </g>
          );
        })}

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredTrip && (
            (() => {
              const trip = trips.find(t => t.id === hoveredTrip);
              if (!trip) return null;
              
              const [x, y] = projectCoordinates(
                trip.location.longitude, 
                trip.location.latitude, 
                mapWidth, 
                mapHeight
              );
              
              return (
                <motion.g
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <rect
                    x={x - 60}
                    y={y - 50}
                    width={120}
                    height={35}
                    fill="white"
                    stroke={getTravelerColor(trip.travelers)}
                    strokeWidth={2}
                    rx={8}
                    className="drop-shadow-lg"
                  />
                  <text
                    x={x}
                    y={y - 38}
                    textAnchor="middle"
                    className="text-sm font-semibold fill-gray-800"
                  >
                    {trip.location.city}
                  </text>
                  <text
                    x={x}
                    y={y - 23}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {new Date(trip.startDate).toLocaleDateString()}
                  </text>
                </motion.g>
              );
            })()
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}