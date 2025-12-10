'use client';

const icons: Record<string, string> = { 'brewery': '🍺', 'winery': '🍷', 'event-space': '🎪', 'park': '🌳', 'market': '🛒', 'other': '📍' };

interface Venue { id: string; name: string; description: string; address: string; lat: number; lng: number; type: string; website?: string; }
interface Truck { id: string; name: string; }
interface Schedule { truckId: string; venueId: string; date: string; }

export default function VenueCard({ venue, schedule, trucks }: { venue: Venue; schedule: Schedule[]; trucks: Truck[] }) {
  const today = new Date().toISOString().split('T')[0];
  const next = schedule.filter(s => s.venueId === venue.id && s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const truck = next ? trucks.find(t => t.id === next.truckId) : null;
  const fmtDate = (d: string) => { const dt = new Date(d + 'T12:00:00'); const t = new Date(); if (dt.toDateString() === t.toDateString()) return 'Today'; const tm = new Date(t); tm.setDate(tm.getDate() + 1); if (dt.toDateString() === tm.toDateString()) return 'Tomorrow'; return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{icons[venue.type] || '📍'}</span>
          <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium capitalize">{venue.type.replace('-', ' ')}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-stone-900 mb-1">{venue.name}</h3>
        <p className="text-sm text-stone-500 mb-4 line-clamp-2">{venue.address}</p>
        {next && truck && (
          <div className="p-3 bg-ridge-50 rounded-xl mb-4">
            <div className="text-xs text-ridge-600 font-semibold uppercase tracking-wide mb-1">Next Food Truck</div>
            <div className="font-medium text-stone-900">{truck.name}</div>
            <div className="text-sm text-stone-600">{fmtDate(next.date)}</div>
          </div>
        )}
        <div className="flex gap-2">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium">Map</a>
          {venue.website && <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium">Website</a>}
        </div>
      </div>
    </div>
  );
}
