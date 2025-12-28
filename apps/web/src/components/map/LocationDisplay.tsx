"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icons for different categories
const CATEGORY_META: Record<string, { color: string; label: string }> = {
  infrastructure: { color: '#3B82F6', label: 'Инфраструктура' },
  environment: { color: '#10B981', label: 'Околна среда' },
  transport: { color: '#F59E0B', label: 'Транспорт' },
  utilities: { color: '#8B5CF6', label: 'Комунални услуги' },
  safety: { color: '#EF4444', label: 'Безопасност' },
  lighting: { color: '#F97316', label: 'Осветление' },
  cleanliness: { color: '#06B6D4', label: 'Чистота' },
  water: { color: '#0D9488', label: 'Водоснабдяване' },
  other: { color: '#6B7280', label: 'Друго' }
};

const getMarkerIcon = (category?: string) => {
  const meta = category ? CATEGORY_META[category] : undefined;
  const color = meta?.color ?? '#3B82F6';

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
  location: LocationData;
  title?: string;
  height?: number;
  showControls?: boolean;
};

export default function LocationDisplay({ 
  location, 
  title = "Местоположение", 
  height = 300,
  showControls = true 
}: Props) {
  const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="overflow-hidden rounded-xl border-2 border-gray-200">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={16}
          style={{ height }}
          className="w-full"
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors" 
          />
          <Marker position={[location.lat, location.lng]} icon={getMarkerIcon(location.category)}>
            <Popup>
              <div className="space-y-2 text-sm">
                {location.category && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: `${(CATEGORY_META[location.category]?.color ?? '#3B82F6')}15`,
                      color: CATEGORY_META[location.category]?.color ?? '#2563EB'
                    }}
                  >
                    ● {CATEGORY_META[location.category]?.label ?? 'Категория'}
                  </span>
                )}
                <div className="font-medium text-gray-900">{title || "Местоположение"}</div>
                {location.address && (
                  <div className="text-gray-600">{location.address}</div>
                )}
                <div className="text-xs text-gray-500 font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Location Info & Controls */}
      {showControls && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              {location.category && (
                <span
                  className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full mb-2"
                  style={{
                    backgroundColor: `${(CATEGORY_META[location.category]?.color ?? '#3B82F6')}15`,
                    color: CATEGORY_META[location.category]?.color ?? '#2563EB'
                  }}
                >
                  ● {CATEGORY_META[location.category]?.label ?? 'Категория'}
                </span>
              )}
              {location.address && (
                <div className="text-sm text-gray-700 mb-2">{location.address}</div>
              )}
              <div className="text-xs text-gray-500 font-mono">
                Координати: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <span className="mr-2">🗺️</span>
                Отвори в Google Maps
              </a>
              
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <span className="mr-2">🧭</span>
                Навигация до тук
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${location.lat}, ${location.lng}`);
                  alert('Координатите са копирани в клипборда');
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">📋</span>
                Копирай координати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
