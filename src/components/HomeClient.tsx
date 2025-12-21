'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TruckCard from '@/components/TruckCard';
import ScheduleCard from '@/components/ScheduleCard';
import VenueCard from '@/components/VenueCard';

// Helper function to get today's date in Eastern Time (must match server)
function getTodayET(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  const hour = now.getUTCHours();
  
  let isDST = false;
  if (month > 2 && month < 10) {
    isDST = true;
  } else if (month === 2) {
    const marchFirst = new Date(year, 2, 1);
    const firstSunday = 1 + (7 - marchFirst.getDay()) % 7;
    const secondSunday = firstSunday + 7;
    if (date > secondSunday || (date === secondSunday && hour >= 7)) {
      isDST = true;
    }
  } else if (month === 10) {
    const novFirst = new Date(year, 10, 1);
    const firstSunday = 1 + (7 - novFirst.getDay()) % 7;
    if (date < firstSunday || (date === firstSunday && hour < 6)) {
      isDST = true;
    }
  }
  
  const offsetHours = isDST ? 4 : 5;
  const etTime = new Date(now.getTime() - (offsetHours * 60 * 60 * 1000));
  
  const y = etTime.getUTCFullYear();
  const m = String(etTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(etTime.getUTCDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}

const MapSection = dynamic(() => import('@/components/MapSection'), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-stone-200 animate-pulse rounded-xl flex items-center justify-center"><span className="text-stone-500">Loading map...</span></div>
});

interface Truck { id: string; name: string; description: string; cuisineType: string; phone?: string; facebook?: string; instagram?: string; }
interface Venue { id: string; name: string; description: string; address: string; lat: number; lng: number; type: string; phone?: string; website?: string; }
interface ScheduleEntry { id: string; truckId: string; venueId: string; date: string; startTime: string; endTime: string; eventName?: string; }

export default function HomeClient({ trucks, venues, schedule }: { trucks: Truck[]; venues: Venue[]; schedule: ScheduleEntry[] }) {
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  const today = getTodayET();
  
  const todaysSchedule = useMemo(() => schedule.filter(s => s.date === today), [schedule, today]);
  const upcomingSchedule = useMemo(() => schedule.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [schedule, today]);
  const cuisineTypes = useMemo(() => ['all', ...Array.from(new Set(trucks.map(t => t.cuisineType))).filter(Boolean).sort()], [trucks]);
  const filteredTrucks = useMemo(() => cuisineFilter === 'all' ? trucks : trucks.filter(t => t.cuisineType === cuisineFilter), [trucks, cuisineFilter]);
  const scheduleByDate = useMemo(() => { 
    const g: Record<string, ScheduleEntry[]> = {}; 
    schedule.forEach(e => { if (!g[e.date]) g[e.date] = []; g[e.date].push(e); }); 
    return g; 
  }, [schedule]);
  
  const getTruckById = (id: string) => trucks.find(t => t.id === id);
  const getVenueById = (id: string) => venues.find(v => v.id === id);

  // Calendar helpers
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];
    
    // Add padding for days before the 1st
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIndex, d));
    }
    
    return days;
  };

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  
  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  
  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const formatTime = (t: string) => { 
    const [h, m] = t.split(':'); 
    const hr = parseInt(h); 
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; 
  };

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="relative bg-gradient-to-br from-ridge-700 via-ridge-600 to-ridge-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"><svg className="w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice"><path d="M0 600 L200 300 L400 450 L600 200 L800 380 L1000 150 L1200 350 L1440 100 L1440 600 Z" fill="currentColor" /></svg></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6">What&apos;s Rollin&apos;<span className="block text-sunset-400">Local</span></h1>
            <p className="text-xl lg:text-2xl text-ridge-100 mb-8">Your guide to food trucks, breweries &amp; events in WNC</p>
            <div className="flex flex-wrap gap-4">
              <a href="#today" className="inline-flex items-center px-6 py-3 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg">Find Trucks Today</a>
              <a href="#trucks" className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/30">Browse All Trucks</a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
            <div><div className="text-4xl font-display font-bold text-sunset-400">{trucks.length}</div><div className="text-ridge-200 text-sm">Food Trucks</div></div>
            <div><div className="text-4xl font-display font-bold text-sunset-400">{venues.length}</div><div className="text-ridge-200 text-sm">Venues</div></div>
            <div><div className="text-4xl font-display font-bold text-sunset-400">{todaysSchedule.length}</div><div className="text-ridge-200 text-sm">Serving Today</div></div>
          </div>
        </div>
        <div className="mountain-divider-inverted"></div>
      </section>

      <section id="today" className="py-16 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">{todaysSchedule.length > 0 ? "Where to Find Trucks Today" : "No Trucks Scheduled Today"}</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">{todaysSchedule.length > 0 ? "Here's where food trucks are serving right now" : "Check back soon or browse the upcoming schedule below"}</p>
          </div>
          {todaysSchedule.length > 0 && (
            <>
              <div className="mb-12"><MapSection scheduleEntries={todaysSchedule} venues={venues} trucks={trucks} /></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todaysSchedule.map(entry => { const truck = getTruckById(entry.truckId); const venue = getVenueById(entry.venueId); if (!truck || !venue) return null; return <ScheduleCard key={entry.id} entry={entry} truck={truck} venue={venue} showDate={false} />; })}
              </div>
            </>
          )}
        </div>
      </section>

      <section id="schedule" className="py-16 lg:py-24 bg-ridge-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">Upcoming Schedule</h2>
            <p className="text-lg text-stone-600 mb-6">Plan ahead and never miss your favorite truck</p>
            
            {/* View Toggle */}
            <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
              <button
                onClick={() => setScheduleView('list')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  scheduleView === 'list' 
                    ? 'bg-ridge-600 text-white shadow-md' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setScheduleView('calendar')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  scheduleView === 'calendar' 
                    ? 'bg-ridge-600 text-white shadow-md' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                📅 Calendar
              </button>
            </div>
          </div>

          {/* Calendar View */}
          {scheduleView === 'calendar' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
              {/* Calendar Header */}
              <div className="bg-ridge-600 text-white px-6 py-4 flex items-center justify-between">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-ridge-500 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-display text-2xl font-bold">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-ridge-500 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-stone-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-sm font-semibold text-stone-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[120px] bg-stone-50 border-t border-r border-stone-200" />;
                  }
                  
                  const dateStr = date.toISOString().split('T')[0];
                  const daySchedule = scheduleByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isPast = dateStr < today;
                  const isSelected = dateStr === selectedDate;
                  
                  return (
                    <div 
                      key={dateStr}
                      onClick={() => daySchedule.length > 0 ? setSelectedDate(isSelected ? null : dateStr) : null}
                      className={`min-h-[120px] border-t border-r border-stone-200 p-2 transition-colors ${
                        isPast ? 'bg-stone-100 opacity-60' : 'bg-white'
                      } ${daySchedule.length > 0 && !isPast ? 'cursor-pointer hover:bg-ridge-50' : ''} ${
                        isSelected ? 'ring-2 ring-ridge-500 ring-inset bg-ridge-50' : ''
                      }`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday 
                          ? 'bg-sunset-500 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                          : isPast ? 'text-stone-400' : 'text-stone-700'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {daySchedule.slice(0, 3).map(entry => {
                          const truck = getTruckById(entry.truckId);
                          if (!truck) return null;
                          return (
                            <div 
                              key={entry.id} 
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                isPast 
                                  ? 'bg-stone-200 text-stone-500' 
                                  : 'bg-ridge-100 text-ridge-700'
                              }`}
                              title={truck.name}
                            >
                              {truck.name}
                            </div>
                          );
                        })}
                        {daySchedule.length > 3 && (
                          <div className="text-xs text-stone-500 px-1.5">
                            +{daySchedule.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Popup Modal */}
              {selectedDate && scheduleByDate[selectedDate] && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={() => setSelectedDate(null)}
                  />
                  
                  {/* Modal */}
                  <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-ridge-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
                      <h4 className="font-display text-xl font-bold">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <button 
                        onClick={() => setSelectedDate(null)}
                        className="p-2 hover:bg-ridge-500 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto">
                      <div className="space-y-4">
                        {scheduleByDate[selectedDate].map(entry => {
                          const truck = getTruckById(entry.truckId);
                          const venue = getVenueById(entry.venueId);
                          if (!truck || !venue) return null;
                          return (
                            <div key={entry.id} className="bg-stone-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-3xl">🚚</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-stone-900 text-lg">{truck.name}</div>
                                  <div className="text-sm text-stone-500">{truck.cuisineType}</div>
                                  <div className="text-sm text-stone-600 mt-1">
                                    📍 {venue.name}
                                  </div>
                                  <div className="text-sm text-stone-600">
                                    🕐 {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                  </div>
                                  {entry.eventName && (
                                    <div className="text-sm text-sunset-600 font-medium mt-1">
                                      🎉 {entry.eventName}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-ridge-600 hover:bg-ridge-700 text-white text-sm font-medium rounded-lg transition-colors text-center shrink-0"
                              >
                                Get Directions
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* List View */}
          {scheduleView === 'list' && (
            <>
              {Object.keys(scheduleByDate).filter(date => date >= today).length === 0 ? (
                <p className="text-center text-stone-500 py-12">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(scheduleByDate)
                    .filter(([date]) => date >= today)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, entries]) => {
                      const dateObj = new Date(date + 'T12:00:00');
                      const isToday = date === today;
                      return (
                        <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                          <div className={`px-6 py-4 ${isToday ? 'bg-sunset-500 text-white' : 'bg-ridge-100'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-display text-2xl font-bold">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                <span className={`text-sm ${isToday ? 'text-sunset-100' : 'text-stone-500'}`}>{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                {isToday && <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">Today</span>}
                              </div>
                              <span className={`text-sm ${isToday ? 'text-sunset-100' : 'text-stone-500'}`}>{entries.length} truck{entries.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {entries.map(entry => { 
                              const truck = getTruckById(entry.truckId); 
                              const venue = getVenueById(entry.venueId); 
                              if (!truck || !venue) return null; 
                              return <ScheduleCard key={entry.id} entry={entry} truck={truck} venue={venue} showDate={false} compact />; 
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section id="trucks" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">All Food Trucks</h2>
            <p className="text-lg text-stone-600 mb-8">Explore all the amazing food trucks in WNC</p>
            {cuisineTypes.length > 1 && <div className="flex flex-wrap justify-center gap-2">{cuisineTypes.map(type => <button key={type} onClick={() => setCuisineFilter(type)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${cuisineFilter === type ? 'bg-ridge-600 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{type === 'all' ? 'All Cuisines' : type}</button>)}</div>}
          </div>
          {filteredTrucks.length === 0 ? <p className="text-center text-stone-500 py-12">No trucks found. Add some in the admin panel!</p> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{filteredTrucks.map(truck => <TruckCard key={truck.id} truck={truck} schedule={schedule} venues={venues} />)}</div>}
        </div>
      </section>

      <section id="venues" className="py-16 lg:py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">Venues &amp; Breweries</h2>
            <p className="text-lg text-stone-600">Local spots that regularly host food trucks</p>
          </div>
          {venues.length === 0 ? <p className="text-center text-stone-500 py-12">No venues found.</p> : <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{venues.map(venue => <VenueCard key={venue.id} venue={venue} schedule={schedule} trucks={trucks} />)}</div>}
        </div>
      </section>

      <section className="bg-gradient-to-br from-ridge-700 to-ridge-900 text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-bold mb-6">Own a Food Truck?</h2>
          <p className="text-lg text-ridge-200 mb-8">Get your truck listed and reach more hungry customers!</p>
          <a href="mailto:hello@whatsrollinlocal.com?subject=Add My Food Truck" className="inline-flex items-center px-8 py-4 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg">Contact Us</a>
        </div>
      </section>

      <div className="bg-stone-200 py-4">
        <p className="text-center text-stone-500 text-sm">Schedules may change — follow your favorite trucks on social for the latest!</p>
      </div>

      <Footer />
    </main>
  );
}
