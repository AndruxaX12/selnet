"use client";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import Button from "@/components/ui/Button";

// Custom marker icons for different categories
const getMarkerIcon = (category?: string) => {
  const categoryColors: Record<string, string> = {
    infrastructure: '#3B82F6', // blue
    environment: '#10B981',    // green
    transport: '#F59E0B',      // yellow
    utilities: '#8B5CF6',      // purple
    safety: '#EF4444',         // red
    lighting: '#F97316',       // orange
    cleanliness: '#06B6D4',    // cyan
    water: '#0D9488',          // teal
    other: '#6B7280'           // gray
  };

  const color = category && categoryColors[category] ? categoryColors[category] : '#3B82F6';

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5S25 25 25 12.5C25 5.596 19.404 0 12.5 0z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="7" fill="white" stroke="${color}" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="3" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

type LocationData = {
  lat: number;
  lng: number;
  address?: string;
  category?: string;
};

type Props = {
  value?: LocationData | null;
  onChange: (pos: LocationData | null) => void;
  height?: number;
  category?: string;
};

function ClickHandler({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

function LocationButton({ onClick, children, className = "" }: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute z-[1000] bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function LocationPicker({ value, onChange, height = 400, category }: Props) {
  const [pin, setPin] = useState<LocationData | null>(value ?? null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => setPin(value ?? null), [value]);

  const handleLocationPick = async (coords: { lat: number; lng: number }) => {
    const newLocation: LocationData = {
      lat: coords.lat,
      lng: coords.lng,
      category: category
    };

    // Try to get address from coordinates (reverse geocoding)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        newLocation.address = data.display_name;
        console.log('🚩 A-1: Nominatim Success - Address Retrieved:', data.display_name);
      } else {
        console.warn('🚩 A-2: Nominatim Warning - No address found in response');
      }
    } catch (error) {
      console.warn('Failed to get address:', error);
    }


    setPin(newLocation);
    console.log('🚩 A-4: Sending to Parent Form:', newLocation);
    onChange(newLocation);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокацията не се поддържа от този браузър');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationPick({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Не можах да получа текущото местоположение');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearLocation = () => {
    setPin(null);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50">
        <MapContainer
          center={pin ? [pin.lat, pin.lng] : [42.9066, 23.7913]}
          zoom={pin ? 17 : 13}
          style={{ height }}
          className="w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onPick={handleLocationPick} />
          {pin && (
            <Marker position={[pin.lat, pin.lng]} icon={getMarkerIcon(pin.category)}>
              <Popup>
                <div className="text-sm p-2">
                  <div className="font-semibold mb-1 text-gray-900">📍 Избрано местоположение</div>
                  <div className="text-gray-600 mb-2 text-xs">
                    {pin.address || "Адресът се зарежда..."}
                  </div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                    {pin.lat.toFixed(6)}<br />
                    {pin.lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Control Buttons */}
        <LocationButton
          onClick={getCurrentLocation}
          className="bottom-3 left-3 bg-white shadow-md top-auto"
        >
          {isLocating ? (
            <div className="flex items-center text-black">
              <span className="animate-spin mr-2">⏳</span>
              <span>Намиране...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center text-black">
                <span className="mr-2">📍</span>
                <span>Моето местоположение</span>
              </div>
            </>
          )}
        </LocationButton>

        {pin && (
          <LocationButton
            onClick={clearLocation}
            className="top-3 right-3 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white shadow-md"
          >
            <span className="mr-1">✕</span>
            Изчисти
          </LocationButton>
        )}

        {/* Instructions Overlay */}
        {!pin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center shadow-lg">
              <div className="text-lg mb-1">🗺️</div>
              <div className="text-sm font-medium text-gray-900">
                Кликнете върху картата
              </div>
              <div className="text-xs text-gray-600">
                за да изберете местоположението
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {pin ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-semibold text-gray-900">Местоположението е избрано</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Координати</div>
                <div className="font-mono text-sm text-gray-700">
                  {pin.lat.toFixed(6)}° N<br />
                  {pin.lng.toFixed(6)}° E
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Адрес</div>
                <div className="text-sm text-gray-700">
                  {pin.address || "Адресът се зарежда..."}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <a
                href={`https://www.google.com/maps?q=${pin.lat},${pin.lng}&ll=${pin.lat},${pin.lng}&z=17`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="mr-2">🗺️</span>
                Отвори в Google Maps
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <span className="text-2xl">📍</span>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Изберете местоположение на картата по-горе
            </div>
            <div className="text-xs text-gray-400">
              Кликнете където и да е върху картата или използвайте GPS бутона
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
