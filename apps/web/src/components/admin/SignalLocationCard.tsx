"use client";
import LocationDisplay from "@/components/map/LocationDisplay";

type LocationData = {
  lat: number;
  lng: number;
  address?: string;
  category?: string;
};

type SignalData = {
  id: string;
  title: string;
  category: string;
  status: string;
  location?: LocationData;
  createdAt: number;
};

type Props = {
  signal: SignalData;
};

export default function SignalLocationCard({ signal }: Props) {
  if (!signal.location) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-gray-500 text-sm">
          📍 Няма избрано местоположение за този сигнал
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Местоположение на сигнала</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            signal.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
            signal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            signal.status === 'resolved' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {signal.status === 'new' ? 'Нов' :
             signal.status === 'in_progress' ? 'В процес' :
             signal.status === 'resolved' ? 'Решен' : signal.status}
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {signal.title} • {signal.category}
        </div>
      </div>

      {/* Map */}
      <div className="p-4">
        <LocationDisplay 
          location={signal.location}
          title={`Сигнал: ${signal.title}`}
          height={250}
        />
      </div>

      {/* Admin Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Промени статус
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Изпрати до кмет
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Добави коментар
          </button>
        </div>
      </div>
    </div>
  );
}
