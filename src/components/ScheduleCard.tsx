'use client';

import { analytics } from '@/lib/analytics';

const icons: Record<string, string> = { 'BBQ': '🍖', 'Mexican': '🌮', 'Burgers': '🍔', 'Vietnamese': '🍜', 'American': '🧀', 'Desserts': '🍦', 'Southern': '🍗', 'Mediterranean': '🥙', 'Pizza': '🍕', 'Vegan': '🥗', 'Coffee': '☕', 'Seafood': '🦐', 'Korean': '🍚' };

interface Truck { id: string; name: string; cuisineType: string; }
interface Venue { id: string; name: string; address: string; lat: number; lng: number; }
interface Entry { id: string; date: string; startTime: string; endTime: string; eventName?: string; truckId?: string | null; }

export default function ScheduleCard({ entry, truck, venue, showDate = true, compact = false }: { entry: Entry; truck: Truck; venue: Venue; showDate?: boolean; compact?: boolean }) {
  const fmtTime = (t: string) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}${m !== '00' ? ':' + m : ''} ${hr >= 12 ? 'PM' : 'AM'}`; };
  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleDirectionsClick = () => {
    // Only track if it's a real truck (not "other")
    if (truck.id && truck.id !== 'other') {
      analytics.directionsClick(truck.id);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
        <span className="text-2xl">{icons[truck.cuisineType] || '🚚'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-stone-900 truncate">{truck.name}</h4>
          <div className="text-sm text-stone-600 truncate">{venue.name}</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium text-stone-900">{fmtTime(entry.startTime)}</div>
          <div className="text-stone-500">{fmtTime(entry.endTime)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        {showDate && <div className="mb-4"><span className="px-3 py-1 bg-ridge-100 text-ridge-700 rounded-full text-sm font-medium">{fmtDate(entry.date)}</span></div>}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-ridge-500 to-ridge-700 rounded-xl flex items-center justify-center"><span className="text-2xl">{icons[truck.cuisineType] || '🚚'}</span></div>
          <div><h3 className="font-display text-lg font-bold text-stone-900">{truck.name}</h3><p className="text-stone-600 text-sm">{truck.cuisineType}</p></div>
        </div>
        {entry.eventName && <div className="mb-4 p-3 bg-sunset-50 rounded-xl border border-sunset-200 text-sunset-700 text-sm font-medium">🎉 {entry.eventName}</div>}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-ridge-100 rounded-lg flex items-center justify-center">📍</div><div><div className="font-medium text-stone-900">{venue.name}</div><div className="text-stone-500">{venue.address}</div></div></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-ridge-100 rounded-lg flex items-center justify-center">🕐</div><div className="font-medium text-stone-900">{fmtTime(entry.startTime)} - {fmtTime(entry.endTime)}</div></div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100">
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={handleDirectionsClick}
            className="block w-full text-center py-2 px-4 bg-ridge-600 hover:bg-ridge-700 text-white rounded-xl text-sm font-medium"
          >
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
