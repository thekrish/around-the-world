'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

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
  type: 'ROUND_TRIP' | 'ONE_WAY';
  departureLocation: Location;
  arrivalLocation: Location;
  startDate: string;
  endDate: string;
  transport: 'PLANE' | 'CAR' | 'TRAIN' | 'BOAT' | 'WALKING';
  travelers: string[];
  notes?: string;
  order: number;
}

interface LeafletMapProps {
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

export default function LeafletMap({ trips, currentTripIndex, onLocationClick }: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Import Leaflet and configure icons
    const setupLeaflet = async () => {
      const leaflet = await import('leaflet');
      
      // Fix default markers
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
      });
      
      setL(leaflet);
    };
    
    setupLeaflet();
  }, []);


  const visibleTrips = trips.slice(0, currentTripIndex + 1);
  const currentTrip = trips[currentTripIndex];

  // Create journey path for current trip
  const getCurrentJourneyPath = () => {
    if (!currentTrip) return [];
    
    const currentTripData = currentTrip;
    
    if (currentTripData.type === 'ROUND_TRIP') {
      // For round trips, animate from departure to arrival
      return [
        [currentTripData.departureLocation.latitude, currentTripData.departureLocation.longitude] as [number, number],
        [currentTripData.arrivalLocation.latitude, currentTripData.arrivalLocation.longitude] as [number, number]
      ];
    } else {
      // For one-way trips, need to determine start point based on previous trip
      if (currentTripIndex === 0) {
        // First trip - animate from departure to arrival
        return [
          [currentTripData.departureLocation.latitude, currentTripData.departureLocation.longitude] as [number, number],
          [currentTripData.arrivalLocation.latitude, currentTripData.arrivalLocation.longitude] as [number, number]
        ];
      } else {
        // Subsequent trip - animate from previous trip's end location to current trip's arrival
        const previousTrip = visibleTrips[currentTripIndex - 1];
        if (!previousTrip) return [];
        
        const startLocation = previousTrip.type === 'ROUND_TRIP' 
          ? previousTrip.departureLocation 
          : previousTrip.arrivalLocation;
        
        return [
          [startLocation.latitude, startLocation.longitude] as [number, number],
          [currentTripData.arrivalLocation.latitude, currentTripData.arrivalLocation.longitude] as [number, number]
        ];
      }
    }
  };

  const currentJourneyPath = getCurrentJourneyPath();

  // Calculate map bounds to show current journey segment
  const getMapBounds = () => {
    if (visibleTrips.length === 0) return { center: [39.8283, -98.5795] as [number, number], zoom: 4 };
    
    if (currentJourneyPath.length === 0) {
      // No journey path, center on first trip's departure location
      const firstTrip = visibleTrips[0];
      return { 
        center: [firstTrip.departureLocation.latitude, firstTrip.departureLocation.longitude] as [number, number], 
        zoom: 8 
      };
    }
    
    // Calculate bounds to include both start and end points of current journey
    const [startCoords, endCoords] = currentJourneyPath;
    
    const lats = [startCoords[0], endCoords[0]];
    const lngs = [startCoords[1], endCoords[1]];
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate zoom level based on distance
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 8;
    if (maxDiff > 50) zoom = 3;
    else if (maxDiff > 20) zoom = 4;
    else if (maxDiff > 10) zoom = 5;
    else if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 7;
    
    return { center: [centerLat, centerLng] as [number, number], zoom };
  };

  const { center, zoom } = getMapBounds();

  // Update map view when currentTripIndex changes
  useEffect(() => {
    if (mapInstance && L && trips.length > 0) {
      // Recalculate bounds for current trip
      const bounds = getMapBounds();
      mapInstance.setView(bounds.center, bounds.zoom, { animate: true, duration: 0.8 });
    }
  }, [currentTripIndex, mapInstance, L, trips]);

  // Animate journey line with transport emoji
  useEffect(() => {
    if (mapInstance && L && currentJourneyPath.length > 1 && currentTrip) {
      // Clear any existing journey animations
      mapInstance.eachLayer((layer: any) => {
        if (layer.options?.className === 'animated-journey') {
          mapInstance.removeLayer(layer);
        }
      });

      const startCoords = currentJourneyPath[0];
      const endCoords = currentJourneyPath[1];
      
      // Create the animated polyline
      let animationProgress = 0;
      const animationDuration = 2500;
      const startTime = Date.now();

      // Calculate rotation angle for emoji orientation
      const calculateRotation = (start: [number, number], end: [number, number]) => {
        const deltaLng = end[1] - start[1];
        const deltaLat = end[0] - start[0];
        const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        return angle;
      };

      const rotation = calculateRotation(startCoords, endCoords);

      // Get transport emoji
      const getTransportEmoji = (transport: string) => {
        switch (transport) {
          case 'PLANE': return '✈️';
          case 'CAR': return '🚗';
          case 'TRAIN': return '🚊';
          case 'BOAT': return '🚢';
          default: return '🚶';
        }
      };

      const transportEmoji = getTransportEmoji(currentTrip.transport);
      
      // Create polyline (starts with zero length)
      const polyline = L.polyline([startCoords, startCoords], {
        color: getTravelerColor(currentTrip.travelers),
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        className: 'animated-journey'
      }).addTo(mapInstance);

      // Create transport emoji marker with rotation
      const marker = L.marker(startCoords, {
        icon: L.divIcon({
          className: 'transport-emoji',
          html: `<div style="
            font-size: 24px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: bounce 0.5s ease-in-out infinite alternate;
            z-index: 1000;
            transform: rotate(${rotation}deg);
            transition: transform 0.3s ease;
          ">${transportEmoji}</div>
          <style>
            @keyframes bounce {
              0% { transform: rotate(${rotation}deg) translateY(0px); }
              100% { transform: rotate(${rotation}deg) translateY(-3px); }
            }
          </style>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }).addTo(mapInstance);

      // Interpolate between coordinates
      const interpolateCoords = (start: [number, number], end: [number, number], progress: number): [number, number] => {
        const lat = start[0] + (end[0] - start[0]) * progress;
        const lng = start[1] + (end[1] - start[1]) * progress;
        return [lat, lng];
      };

      // Animation function
      const animate = () => {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);

        // Update polyline to show drawing progress
        const currentEndCoord = interpolateCoords(startCoords, endCoords, animationProgress);
        polyline.setLatLngs([startCoords, currentEndCoord]);

        // Update marker position to follow the line
        marker.setLatLng(currentEndCoord);

        // Continue animation if not complete
        if (animationProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - hide transport emoji after brief pause
          setTimeout(() => {
            if (mapInstance.hasLayer(marker)) {
              mapInstance.removeLayer(marker);
            }
          }, 800);
        }
      };

      // Start animation immediately after a brief delay for map setup
      setTimeout(() => {
        animate();
      }, 100);

      // Cleanup function
      return () => {
        if (mapInstance.hasLayer(polyline)) {
          mapInstance.removeLayer(polyline);
        }
        if (mapInstance.hasLayer(marker)) {
          mapInstance.removeLayer(marker);
        }
      };
    }
  }, [currentTripIndex, mapInstance, L, currentJourneyPath, currentTrip]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  // Create custom icons for each traveler type
  const createCustomIcon = (travelers: string[], isCurrentTrip: boolean) => {
    const color = getTravelerColor(travelers);
    const size = isCurrentTrip ? 40 : 30;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 30 ? '14px' : '12px'};
          ${isCurrentTrip ? 'animation: pulse 2s infinite;' : ''}
        ">
          ${isCurrentTrip ? '📍' : '•'}
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        ref={(map) => {
          if (map && !mapInstance) {
            setMapInstance(map);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Journey path is now handled by the animated effect above */}
        
        {/* Trip markers - show both departure and arrival locations */}
        {visibleTrips.map((trip, index) => {
          const markers = [];
          const isCurrentTrip = index === currentTripIndex;
          
          // Always show departure location marker
          markers.push(
            <Marker
              key={`${trip.id}-departure`}
              position={[trip.departureLocation.latitude, trip.departureLocation.longitude]}
              icon={createCustomIcon(trip.travelers, isCurrentTrip)}
              eventHandlers={{
                click: () => onLocationClick([trip.departureLocation.longitude, trip.departureLocation.latitude])
              }}
            >
              <Popup>
                <div className="text-center p-2">
                  <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                  <p className="text-gray-600 mb-2">{trip.departureLocation.city}, {trip.departureLocation.country}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {trip.travelers.map((traveler, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 rounded-full text-xs text-blue-800"
                      >
                        {traveler}
                      </span>
                    ))}
                  </div>
                  {trip.notes && (
                    <p className="text-sm text-gray-700 italic">{trip.notes}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
          
          // For one-way trips, also show arrival location marker
          if (trip.type === 'ONE_WAY') {
            markers.push(
              <Marker
                key={`${trip.id}-arrival`}
                position={[trip.arrivalLocation.latitude, trip.arrivalLocation.longitude]}
                icon={createCustomIcon(trip.travelers, isCurrentTrip)}
                eventHandlers={{
                  click: () => onLocationClick([trip.arrivalLocation.longitude, trip.arrivalLocation.latitude])
                }}
              >
                <Popup>
                  <div className="text-center p-2">
                    <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                    <p className="text-gray-600 mb-2">{trip.arrivalLocation.city}, {trip.arrivalLocation.country}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                      {trip.travelers.map((traveler, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 rounded-full text-xs text-blue-800"
                        >
                          {traveler}
                        </span>
                      ))}
                    </div>
                    {trip.notes && (
                      <p className="text-sm text-gray-700 italic">{trip.notes}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
          
          return markers;
        })}
      </MapContainer>
    </div>
  );
}