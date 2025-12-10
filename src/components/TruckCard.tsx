'use client';

const icons: Record<string, string> = { 'BBQ': '🍖', 'Mexican': '🌮', 'Burgers': '🍔', 'Vietnamese': '🍜', 'American': '🧀', 'Desserts': '🍦', 'Southern': '🍗', 'Mediterranean': '🥙', 'Pizza': '🍕', 'Vegan': '🥗', 'Coffee': '☕', 'Seafood': '🦐', 'Korean': '🍚' };

interface Truck { id: string; name: string; description: string; cuisineType: string; phone?: string; facebook?: string; instagram?: string; }
interface Venue { id: string; name: string; }
interface Schedule { truckId: string; venueId: string; date: string; startTime: string; endTime: string; }

export default function TruckCard({ truck, schedule, venues }: { truck: Truck; schedule: Schedule[]; venues: Venue[] }) {
  const today = new Date().toISOString().split('T')[0];
  const next = schedule.filter(s => s.truckId === truck.id && s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const venue = next ? venues.find(v => v.id === next.venueId) : null;
  
  const fmtDate = (d: string) => { const dt = new Date(d + 'T12:00:00'); const t = new Date(); if (dt.toDateString() === t.toDateString()) return 'Today'; const tm = new Date(t); tm.setDate(tm.getDate() + 1); if (dt.toDateString() === tm.toDateString()) return 'Tomorrow'; return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
  const fmtTime = (t: string) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}${m !== '00' ? ':' + m : ''} ${hr >= 12 ? 'PM' : 'AM'}`; };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
      <div className="bg-gradient-to-r from-ridge-600 to-ridge-700 px-6 py-4 flex items-center justify-between">
        <span className="text-3xl">{icons[truck.cuisineType] || '🚚'}</span>
        <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">{truck.cuisineType}</span>
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl font-bold text-stone-900 mb-2">{truck.name}</h3>
        <p className="text-stone-600 text-sm mb-4 line-clamp-2">{truck.description}</p>
        {next && venue && (
          <div className="mb-4 p-3 bg-ridge-50 rounded-xl">
            <div className="text-xs text-ridge-600 font-semibold uppercase tracking-wide mb-1">Next Appearance</div>
            <div className="text-sm"><span className="font-semibold text-stone-900">{fmtDate(next.date)}</span> • <span className="text-stone-600">{venue.name}</span></div>
            <div className="text-xs text-stone-500 mt-1">{fmtTime(next.startTime)} - {fmtTime(next.endTime)}</div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
          {truck.phone && <a href={`tel:${truck.phone}`} className="p-2 text-stone-400 hover:text-ridge-600 hover:bg-ridge-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></a>}
          {truck.facebook && <a href={truck.facebook} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-400 hover:text-[#1877F2] hover:bg-blue-50 rounded-lg"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
          {truck.instagram && <a href={truck.instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-400 hover:text-[#E4405F] hover:bg-pink-50 rounded-lg"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/></svg></a>}
        </div>
      </div>
    </div>
  );
}
