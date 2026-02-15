
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';

// Fix default marker icon issue with Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const primaryIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'primary-marker',
});

import { AppLocation } from '../types';

// ... (keep L.Icon code if needed, but I'm just replacing the props interface)

interface MapLocationScreenProps {
  currentLocation: AppLocation;
  onBack: () => void;
  onSelectLocation: (loc: AppLocation) => void;
}

const CAMPUS_LOCATIONS = [
  { name: 'Palo Alto', lat: 37.4419, lng: -122.1430, desc: 'City Center' },
  { name: 'Stanford Campus', lat: 37.4275, lng: -122.1697, desc: 'Main University Area' },
  { name: 'North Campus', lat: 37.4500, lng: -122.1550, desc: 'Housing & Tech Hub' },
  { name: 'East Palo Alto', lat: 37.4688, lng: -122.1411, desc: 'Local Student Community' },
  { name: 'Menlo Park', lat: 37.4529, lng: -122.1817, desc: 'Graduate Student Circle' },
];

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapLocationScreen: React.FC<MapLocationScreenProps> = ({ currentLocation, onBack, onSelectLocation }) => {
  const { updateProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with passed location or default
  const [selectedLoc, setSelectedLoc] = useState<AppLocation>(currentLocation);

  const [customPin, setCustomPin] = useState<{ lat: number; lng: number; name: string } | null>(
    // If current location is not in predefined list, treat as custom pin
    !CAMPUS_LOCATIONS.some(l => l.lat === currentLocation.lat && l.lng === currentLocation.lng)
      ? { ...currentLocation }
      : null
  );

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const filteredLocations = CAMPUS_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMapClick = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const name = data?.address?.suburb || data?.address?.city || data?.address?.town || data?.display_name?.split(',')[0] || 'Custom Location';
      setCustomPin({ lat, lng, name });
      setSelectedLoc({ name, lat, lng });
    } catch {
      setCustomPin({ lat, lng, name: 'Pinned Location' });
      setSelectedLoc({ name: 'Pinned Location', lat, lng });
    }
    setIsReverseGeocoding(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await handleMapClick(latitude, longitude);
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSetLocation = async () => {
    try {
      // Save just the name to profile for now, or update profile schema to support lat/lng if needed
      await updateProfile({ location: selectedLoc.name });
    } catch { /* guest mode - no profile */ }
    onSelectLocation(selectedLoc);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
      {/* Search Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md z-[1000] border-b border-slate-200 space-y-3 relative">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-secondary active:scale-90 transition-transform">
            <span className="material-icons">arrow_back</span>
          </button>
          <div className="relative flex-1">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none text-secondary placeholder-slate-400 shadow-sm"
              placeholder="Search campus or city..."
              type="text"
            />
          </div>
          <button
            onClick={handleUseMyLocation}
            disabled={detectingLocation}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-90 disabled:opacity-50"
            title="Use my location"
          >
            <span className="material-icons">{detectingLocation ? 'sync' : 'my_location'}</span>
          </button>
        </div>

        {/* Quick Location Chips */}
        {searchQuery && filteredLocations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filteredLocations.map(loc => (
              <button
                key={loc.name}
                onClick={() => { setSelectedLoc(loc); setCustomPin(null); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedLoc.name === loc.name
                  ? 'bg-primary text-slate-900 border-primary shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[selectedLoc.lat, selectedLoc.lng]}
          zoom={14}
          className="w-full h-full"
          zoomControl={false}
          style={{ background: '#f8fafc' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FlyToLocation lat={selectedLoc.lat} lng={selectedLoc.lng} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Campus Location Markers */}
          {CAMPUS_LOCATIONS.map(loc => (
            <Marker
              key={loc.name}
              position={[loc.lat, loc.lng]}
              icon={primaryIcon}
              eventHandlers={{
                click: () => { setSelectedLoc(loc); setCustomPin(null); }
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{loc.name}</strong><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{loc.desc}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Custom Pin */}
          {customPin && (
            <Marker position={[customPin.lat, customPin.lng]}>
              <Popup>
                <strong>{customPin.name}</strong><br />
                <span style={{ fontSize: '12px', color: '#666' }}>Custom location</span>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Loading Overlay */}
        {isReverseGeocoding && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md text-secondary px-4 py-2 rounded-full text-xs font-semibold border border-primary/30 flex items-center gap-2 shadow-lg">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Getting location name...
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-icons text-2xl">explore</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-secondary truncate">{selectedLoc.name}</h3>
              <p className="text-xs text-slate-500 truncate">Tap map to pin location</p>
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
