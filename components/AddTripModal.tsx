'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Users, Plane, Car, Train, Sailboat, PersonStanding } from 'lucide-react';

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
  attendees?: string[];
  tags?: string[];
  order: number;
}

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trip: Omit<Trip, 'id' | 'order'>) => void;
}

const transportOptions = [
  { value: 'PLANE' as const, label: 'Plane', icon: Plane },
  { value: 'CAR' as const, label: 'Car', icon: Car },
  { value: 'TRAIN' as const, label: 'Train', icon: Train },
  { value: 'BOAT' as const, label: 'Boat', icon: Sailboat },
  { value: 'WALKING' as const, label: 'Walking', icon: PersonStanding },
];

const travelerOptions = ['You', 'Celia'];

// Interface for city search results
interface CityResult {
  name: string;
  country: string;
  lat: number;
  lng: number;
  display_name: string;
}

// Function to search cities using OpenStreetMap Nominatim API
const searchCities = async (query: string): Promise<CityResult[]> => {
  if (!query.trim() || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + 
      new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '8',
        'accept-language': 'en',
        // Remove restrictive featuretype - let's get all place types
        extratags: '1',
      })
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data
      .filter((item: any) => {
        // More inclusive filtering - accept cities, towns, villages, and administrative areas
        const validTypes = ['city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood', 'administrative'];
        const validClasses = ['place', 'boundary'];
        
        return (
          validClasses.includes(item.class) ||
          validTypes.includes(item.type) ||
          (item.address && (item.address.city || item.address.town || item.address.village))
        );
      })
      .map((item: any) => {
        // Better name extraction - prioritize actual city names
        let cityName = item.name || item.display_name.split(',')[0];
        
        // If we have address details, prefer the city/town name
        if (item.address) {
          cityName = item.address.city || item.address.town || item.address.village || cityName;
        }
        
        return {
          name: cityName,
          country: item.address?.country || 'Unknown',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          display_name: item.display_name,
        };
      })
      .slice(0, 5);
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};

export default function AddTripModal({ isOpen, onClose, onAddTrip }: AddTripModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'ROUND_TRIP' as 'ROUND_TRIP' | 'ONE_WAY',
    departureLocation: {
      id: '',
      name: '',
      city: '',
      country: '',
      latitude: 0,
      longitude: 0,
    },
    arrivalLocation: {
      id: '',
      name: '',
      city: '',
      country: '',
      latitude: 0,
      longitude: 0,
    },
    startDate: '',
    endDate: '',
    transport: 'PLANE' as const,
    travelers: [] as string[],
    notes: '',
    attendees: [] as string[],
    tags: [] as string[],
  });

  const [newAttendee, setNewAttendee] = useState('');
  const [newTag, setNewTag] = useState('');
  
  // Autocomplete states
  const [departureQuery, setDepartureQuery] = useState('');
  const [arrivalQuery, setArrivalQuery] = useState('');
  const [departureSuggestions, setDepartureSuggestions] = useState<CityResult[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<CityResult[]>([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false);
  const [isSearchingDeparture, setIsSearchingDeparture] = useState(false);
  const [isSearchingArrival, setIsSearchingArrival] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.startDate || !formData.endDate || 
        !formData.departureLocation.city || !formData.arrivalLocation.city ||
        formData.travelers.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    onAddTrip(formData);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      type: 'ROUND_TRIP',
      departureLocation: {
        id: '',
        name: '',
        city: '',
        country: '',
        latitude: 0,
        longitude: 0,
      },
      arrivalLocation: {
        id: '',
        name: '',
        city: '',
        country: '',
        latitude: 0,
        longitude: 0,
      },
      startDate: '',
      endDate: '',
      transport: 'PLANE',
      travelers: [],
      notes: '',
      attendees: [],
      tags: [],
    });
    setNewAttendee('');
    setNewTag('');
    
    // Reset autocomplete states
    setDepartureQuery('');
    setArrivalQuery('');
    setDepartureSuggestions([]);
    setArrivalSuggestions([]);
    setShowDepartureSuggestions(false);
    setShowArrivalSuggestions(false);
    setIsSearchingDeparture(false);
    setIsSearchingArrival(false);
    
    // Clear any pending debounce timeouts
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    onClose();
  };

  const toggleTraveler = (traveler: string) => {
    setFormData(prev => ({
      ...prev,
      travelers: prev.travelers.includes(traveler)
        ? prev.travelers.filter(t => t !== traveler)
        : [...prev.travelers, traveler]
    }));
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (attendee: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Debounce search to avoid too many API calls
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Handle location input changes with autocomplete
  const handleLocationInputChange = (field: 'departureLocation' | 'arrivalLocation', value: string) => {
    if (field === 'departureLocation') {
      setDepartureQuery(value);
      
      // Clear previous timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      if (value.length >= 2) {
        setIsSearchingDeparture(true);
        
        // Debounce API call by 300ms
        debounceTimeout.current = setTimeout(async () => {
          const suggestions = await searchCities(value);
          setDepartureSuggestions(suggestions);
          setShowDepartureSuggestions(suggestions.length > 0);
          setIsSearchingDeparture(false);
        }, 300);
      } else {
        setDepartureSuggestions([]);
        setShowDepartureSuggestions(false);
        setIsSearchingDeparture(false);
      }
    } else {
      setArrivalQuery(value);
      
      // Clear previous timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      if (value.length >= 2) {
        setIsSearchingArrival(true);
        
        // Debounce API call by 300ms
        debounceTimeout.current = setTimeout(async () => {
          const suggestions = await searchCities(value);
          setArrivalSuggestions(suggestions);
          setShowArrivalSuggestions(suggestions.length > 0);
          setIsSearchingArrival(false);
        }, 300);
      } else {
        setArrivalSuggestions([]);
        setShowArrivalSuggestions(false);
        setIsSearchingArrival(false);
      }
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (field: 'departureLocation' | 'arrivalLocation', city: CityResult) => {
    const locationData = {
      id: `${field}-${Date.now()}`,
      name: city.name,
      city: city.name,
      country: city.country,
      latitude: city.lat,
      longitude: city.lng,
    };

    setFormData(prev => ({
      ...prev,
      [field]: locationData
    }));

    if (field === 'departureLocation') {
      setDepartureQuery(city.name);
      setShowDepartureSuggestions(false);
    } else {
      setArrivalQuery(city.name);
      setShowArrivalSuggestions(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Add New Trip</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Trip Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Trip Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Vegas Weekend"
                    required
                  />
                </div>

                {/* Trip Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Trip Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="ROUND_TRIP"
                        checked={formData.type === 'ROUND_TRIP'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'ROUND_TRIP' }))}
                        className="mr-2"
                      />
                      Round Trip
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="ONE_WAY"
                        checked={formData.type === 'ONE_WAY'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'ONE_WAY' }))}
                        className="mr-2"
                      />
                      One Way
                    </label>
                  </div>
                </div>

                {/* Locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Departure City */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Departure City *
                    </label>
                    <input
                      type="text"
                      value={departureQuery}
                      onChange={(e) => handleLocationInputChange('departureLocation', e.target.value)}
                      onFocus={() => {
                        if (departureSuggestions.length > 0) {
                          setShowDepartureSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow for click
                        setTimeout(() => setShowDepartureSuggestions(false), 200);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="e.g., Los Angeles"
                      required
                    />
                    
                    {/* Departure Suggestions */}
                    {(showDepartureSuggestions || isSearchingDeparture) && (
                      <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearchingDeparture ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span>Searching cities...</span>
                            </div>
                          </div>
                        ) : departureSuggestions.length > 0 ? (
                          departureSuggestions.map((city, index) => (
                            <button
                              key={`${city.name}-${index}`}
                              type="button"
                              onClick={() => handleLocationSelect('departureLocation', city)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                            >
                              <div className="font-medium">{city.name}</div>
                              <div className="text-sm text-gray-500">{city.country}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center text-sm">
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrival City */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      {formData.type === 'ROUND_TRIP' ? 'Destination City' : 'Arrival City'} *
                    </label>
                    <input
                      type="text"
                      value={arrivalQuery}
                      onChange={(e) => handleLocationInputChange('arrivalLocation', e.target.value)}
                      onFocus={() => {
                        if (arrivalSuggestions.length > 0) {
                          setShowArrivalSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow for click
                        setTimeout(() => setShowArrivalSuggestions(false), 200);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="e.g., Las Vegas"
                      required
                    />
                    
                    {/* Arrival Suggestions */}
                    {(showArrivalSuggestions || isSearchingArrival) && (
                      <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearchingArrival ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span>Searching cities...</span>
                            </div>
                          </div>
                        ) : arrivalSuggestions.length > 0 ? (
                          arrivalSuggestions.map((city, index) => (
                            <button
                              key={`${city.name}-${index}`}
                              type="button"
                              onClick={() => handleLocationSelect('arrivalLocation', city)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                            >
                              <div className="font-medium">{city.name}</div>
                              <div className="text-sm text-gray-500">{city.country}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center text-sm">
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Transportation
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {transportOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, transport: option.value }))}
                          className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                            formData.transport === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-1" />
                          <span className="text-xs">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Travelers */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Travelers *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {travelerOptions.map((traveler) => (
                      <button
                        key={traveler}
                        type="button"
                        onClick={() => toggleTraveler(traveler)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          formData.travelers.includes(traveler)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {traveler}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Attendees (optional)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newAttendee}
                      onChange={(e) => setNewAttendee(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Add someone who joined you"
                    />
                    <button
                      type="button"
                      onClick={addAttendee}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.attendees.map((attendee) => (
                      <span
                        key={attendee}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {attendee}
                        <button
                          type="button"
                          onClick={() => removeAttendee(attendee)}
                          className="ml-2 hover:text-purple-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tags (optional)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Add a tag (e.g., vacation, business)"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-indigo-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                    placeholder="Share your memories or notes about this trip..."
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Trip
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}