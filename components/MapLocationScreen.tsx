import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext';
import { AppLocation } from '../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const LIBRARIES: ('places' | 'marker')[] = ['places', 'marker'];

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 },
  clickableIcons: false,
  mapId: 'DEMO_MAP_ID', // required for AdvancedMarkerElement
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

const CAMPUS_LOCATIONS = [
  { name: 'Palo Alto', lat: 37.4419, lng: -122.1430, desc: 'City Center' },
  { name: 'Stanford Campus', lat: 37.4275, lng: -122.1697, desc: 'Main University Area' },
  { name: 'North Campus', lat: 37.4500, lng: -122.1550, desc: 'Housing & Tech Hub' },
  { name: 'East Palo Alto', lat: 37.4688, lng: -122.1411, desc: 'Local Student Community' },
  { name: 'Menlo Park', lat: 37.4529, lng: -122.1817, desc: 'Graduate Student Circle' },
];

interface MapLocationScreenProps {
  currentLocation: AppLocation;
  onBack: () => void;
  onSelectLocation: (loc: AppLocation) => void;
}

const MapLocationScreen: React.FC<MapLocationScreenProps> = ({ currentLocation, onBack, onSelectLocation }) => {
  const { updateProfile } = useAuth();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    version: 'weekly',
  });

  const [selectedLoc, setSelectedLoc] = useState<AppLocation>(currentLocation);
  const [customPin, setCustomPin] = useState<{ lat: number; lng: number; name: string } | null>(
    !CAMPUS_LOCATIONS.some(l => l.lat === currentLocation.lat && l.lng === currentLocation.lng)
      ? { ...currentLocation }
      : null
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: currentLocation.lat, lng: currentLocation.lng });
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; mainText: string; secondaryText: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const campusMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const customMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    placesServiceRef.current = new google.maps.places.PlacesService(map);

    // Add campus markers using AdvancedMarkerElement
    CAMPUS_LOCATIONS.forEach(loc => {
      const pin = new google.maps.marker.PinElement({
        background: '#ef4444',
        borderColor: '#b91c1c',
        glyphColor: '#ffffff',
        scale: 0.9,
      });
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: loc.lat, lng: loc.lng },
        title: loc.name,
        content: pin.element,
      });
      marker.addListener('click', () => selectCampusLocation(loc));
      campusMarkersRef.current.push(marker);
    });
  }, []);

  // Manage custom pin marker
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    // Remove existing custom marker
    if (customMarkerRef.current) {
      customMarkerRef.current.map = null;
      customMarkerRef.current = null;
    }
    if (customPin) {
      const pin = new google.maps.marker.PinElement({
        background: '#3b82f6',
        borderColor: '#1d4ed8',
        glyphColor: '#ffffff',
        scale: 1.1,
      });
      customMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: customPin.lat, lng: customPin.lng },
        title: customPin.name,
        content: pin.element,
      });
    }
  }, [customPin, isLoaded]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const components = results[0].address_components;
          const neighborhood = components.find(c => c.types.includes('neighborhood'))?.long_name;
          const locality = components.find(c => c.types.includes('locality'))?.long_name;
          const sublocality = components.find(c => c.types.includes('sublocality'))?.long_name;
          resolve(neighborhood || sublocality || locality || results[0].formatted_address.split(',')[0]);
        } else {
          resolve('Pinned Location');
        }
      });
    });
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setIsReverseGeocoding(true);
    const name = await reverseGeocode(lat, lng);
    setCustomPin({ lat, lng, name });
    setSelectedLoc({ name, lat, lng });
    setIsReverseGeocoding(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      autocompleteServiceRef.current!.getPlacePredictions(
        { input: value },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.map(p => ({
              placeId: p.place_id,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text,
            })));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300);
  };

  const handleSelectSuggestion = (placeId: string, mainText: string) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId, fields: ['geometry', 'name', 'formatted_address'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name || mainText;
          setCustomPin({ lat, lng, name });
          setSelectedLoc({ name, lat, lng });
          setMapCenter({ lat, lng });
          mapRef.current?.panTo({ lat, lng });
          mapRef.current?.setZoom(15);
          setSearchValue(name);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsReverseGeocoding(true);
        const name = await reverseGeocode(lat, lng);
        setCustomPin({ lat, lng, name });
        setSelectedLoc({ name, lat, lng });
        setMapCenter({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(15);
        setIsReverseGeocoding(false);
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSetLocation = async () => {
    try {
      await updateProfile({ location: selectedLoc.name });
    } catch { /* guest mode */ }
    onSelectLocation(selectedLoc);
  };

  const selectCampusLocation = (loc: typeof CAMPUS_LOCATIONS[0]) => {
    setSelectedLoc(loc);
    setCustomPin(null);
    setMapCenter({ lat: loc.lat, lng: loc.lng });
    mapRef.current?.panTo({ lat: loc.lat, lng: loc.lng });
    mapRef.current?.setZoom(15);
  };

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <span className="material-icons text-4xl mb-2">map</span>
          <p className="text-sm">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
      {/* Search Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md z-[1000] border-b border-slate-200 space-y-3 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-secondary active:scale-90 transition-transform"
          >
            <span className="material-icons">arrow_back</span>
          </button>

          <div className="relative flex-1">
            <input
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              disabled={!isLoaded}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none text-secondary placeholder-slate-400 shadow-sm"
              placeholder={isLoaded ? 'Search any location...' : 'Loading...'}
              type="text"
            />
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">search</span>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[2000] overflow-hidden">
                {suggestions.map(s => (
                  <button
                    key={s.placeId}
                    onMouseDown={() => handleSelectSuggestion(s.placeId, s.mainText)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 border-b border-slate-100 last:border-0"
                  >
                    <span className="material-icons text-slate-400 text-base mt-0.5 shrink-0">place</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary truncate">{s.mainText}</p>
                      <p className="text-xs text-slate-400 truncate">{s.secondaryText}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleUseMyLocation}
            disabled={detectingLocation || !isLoaded}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-90 disabled:opacity-50"
            title="Use my location"
          >
            <span className="material-icons">{detectingLocation ? 'sync' : 'my_location'}</span>
          </button>
        </div>

        {/* Quick Location Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CAMPUS_LOCATIONS.map(loc => (
            <button
              key={loc.name}
              onClick={() => selectCampusLocation(loc)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedLoc.name === loc.name
                  ? 'bg-primary text-slate-900 border-primary shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={mapCenter}
            zoom={14}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
            onClick={handleMapClick}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Reverse geocoding overlay */}
        {isReverseGeocoding && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md text-secondary px-4 py-2 rounded-full text-xs font-semibold border border-primary/30 flex items-center gap-2 shadow-lg">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Getting location name...
          </div>
        )}

        {/* Bottom card */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-icons text-2xl">explore</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-secondary truncate">{selectedLoc.name}</h3>
              <p className="text-xs text-slate-500 truncate">Tap map to pin any location</p>
            </div>
            <button
              onClick={handleSetLocation}
              className="bg-primary text-slate-900 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all shrink-0"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLocationScreen;
