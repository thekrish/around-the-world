'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';

interface TimelineControlsProps {
  currentIndex: number;
  totalTrips: number;
  isPlaying: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export default function TimelineControls({
  currentIndex,
  totalTrips,
  isPlaying,
  onPrevious,
  onNext,
  onPlayPause,
  onReset
}: TimelineControlsProps) {
  const progress = totalTrips > 0 ? ((currentIndex + 1) / totalTrips) * 100 : 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70 text-sm">Journey Progress</span>
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} of {totalTrips}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {/* Reset Button */}
        <motion.button
          onClick={onReset}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex === 0}
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </motion.button>

        {/* Previous Button */}
        <motion.button
          onClick={onPrevious}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex <= 0}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        {/* Play/Pause Button */}
        <motion.button
          onClick={onPlayPause}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-colors shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={totalTrips === 0}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </motion.button>

        {/* Next Button */}
        <motion.button
          onClick={onNext}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex >= totalTrips - 1}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.button>

        {/* Fast Forward to End */}
        <motion.button
          onClick={() => {/* Jump to last trip */}}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={currentIndex === totalTrips - 1}
        >
          <div className="flex space-x-1">
            <ChevronRight className="w-4 h-4 text-white" />
            <ChevronRight className="w-4 h-4 text-white -ml-2" />
          </div>
        </motion.button>
      </div>

      {/* Timeline Info */}
      <div className="mt-4 text-center">
        <p className="text-white/60 text-sm">
          {isPlaying ? 'Playing journey...' : 'Paused'}
        </p>
      </div>
    </div>
  );
}