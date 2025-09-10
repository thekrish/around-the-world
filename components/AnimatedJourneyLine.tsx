'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedJourneyLineProps {
  startCoords: [number, number];
  endCoords: [number, number];
  transport: 'PLANE' | 'CAR' | 'TRAIN' | 'BOAT' | 'WALKING';
  color: string;
  isActive: boolean;
}

// Custom hook to create a Leaflet component
const useLeafletComponent = (
  map: any,
  startCoords: [number, number],
  endCoords: [number, number],
  transport: string,
  color: string,
  isActive: boolean
) => {
  useEffect(() => {
    if (!map || !isActive) return;

    const L = (window as any).L;
    if (!L) return;

    // Create the polyline (initially with 0 length)
    const polyline = L.polyline([startCoords, startCoords], {
      color: color,
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Create transport emoji marker
    const getTransportEmoji = (transport: string) => {
      switch (transport) {
        case 'PLANE': return '✈️';
        case 'CAR': return '🚗';
        case 'TRAIN': return '🚊';
        case 'BOAT': return '🚢';
        default: return '🚶';
      }
    };

    const transportEmoji = getTransportEmoji(transport);
    
    // Create animated marker
    const marker = L.marker(startCoords, {
      icon: L.divIcon({
        className: 'transport-emoji',
        html: `<div style="
          font-size: 24px; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          animation: bounce 0.5s ease-in-out infinite alternate;
        ">${transportEmoji}</div>
        <style>
          @keyframes bounce {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-3px); }
          }
        </style>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    }).addTo(map);

    // Animation variables
    let animationProgress = 0;
    const animationDuration = 2500; // 2.5 seconds
    const startTime = Date.now();

    // Interpolate between two coordinates
    const interpolateCoords = (start: [number, number], end: [number, number], progress: number): [number, number] => {
      const lat = start[0] + (end[0] - start[0]) * progress;
      const lng = start[1] + (end[1] - start[1]) * progress;
      return [lat, lng];
    };

    // Animation function
    const animate = () => {
      const elapsed = Date.now() - startTime;
      animationProgress = Math.min(elapsed / animationDuration, 1);

      // Update polyline to show progress
      const currentEndCoord = interpolateCoords(startCoords, endCoords, animationProgress);
      polyline.setLatLngs([startCoords, currentEndCoord]);

      // Update marker position
      marker.setLatLng(currentEndCoord);

      // Continue animation if not complete
      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - hide the transport emoji after a brief pause
        setTimeout(() => {
          map.removeLayer(marker);
        }, 500);
      }
    };

    // Start animation
    animate();

    // Cleanup function
    return () => {
      map.removeLayer(polyline);
      map.removeLayer(marker);
    };
  }, [map, startCoords, endCoords, transport, color, isActive]);
};

export default function AnimatedJourneyLine({
  startCoords,
  endCoords,
  transport,
  color,
  isActive
}: AnimatedJourneyLineProps) {
  // This is a hook-based component that doesn't render JSX
  // It uses the map context to add/remove layers directly
  return null;
}

// Export the hook for direct use in the map component
export { useLeafletComponent as useAnimatedJourneyLine };