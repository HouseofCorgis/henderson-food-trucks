'use client';

import { useState, useMemo, useEffect } from 'react';
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

// Helper function to get date X days from now in YYYY-MM-DD format
function getDatePlusDays(baseDate: string, days: number): string {
  const date = new Date(baseDate + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MapSection = dynamic(() => import('@/components/MapSection'), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-stone-200 animate-pulse rounded-xl flex items-center justify-center"><span className="text-stone-500">Loading map...</span></div>
});

interface Truck { id: string; name: string; description: string; cuisineType: string; phone?: string; facebook?: string; instagram?: string; }
interface Venue { id: string; name: string; description: string; address: string; lat: number; lng: number; type: string; phone?: string; website?: string; }
interface ScheduleEntry { id: string; truckId: string | null; venueId: string | null; date: string; startTime: string; endTime: string; eventName?: string; otherTruckName?: string; otherVenueName?: string; }

export default function HomeClient({ trucks, venues, allTrucks, allVenues, schedule }: { trucks: Truck[]; venues: Venue[]; allTrucks?: Truck[]; allVenues?: Venue[]; schedule: ScheduleEntry[] }) {
  // Use allTrucks/allVenues for schedule lookups, fall back to trucks/venues if not provided
  const scheduleTrucks = allTrucks || trucks;
  const scheduleVenues = allVenues || venues;
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Use state for today to avoid hydration mismatch between server and client
  const [today, setToday] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setToday(getTodayET());
    setIsClient(true);
  }, []);

  // Calculate the date 2 weeks from today for list view limit
  const twoWeeksFromToday = useMemo(() => {
    if (!today) return '';
    return getDatePlusDays(today, 14);
  }, [today]);
  
  const todaysSchedule = useMemo(() => {
    if (!today) return [];
    return schedule.filter(s => s.date === today);
  }, [schedule, today]);
  const upcomingSchedule = useMemo(() => {
    if (!today) return schedule.sort((a, b) => a.date.localeCompare(b.date));
    return schedule.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule, today]);
  const cuisineTypes = useMemo(() => ['all', ...Array.from(new Set(trucks.map(t => t.cuisineType))).filter(Boolean).sort()], [trucks]);
  const filteredTrucks = useMemo(() => cuisineFilter === 'all' ? trucks : trucks.filter(t => t.cuisineType === cuisineFilter), [trucks, cuisineFilter]);
  const scheduleByDate = useMemo(() => { 
    const g: Record<string, ScheduleEntry[]> = {}; 
    schedule.forEach(e => { if (!g[e.date]) g[e.date] = []; g[e.date].push(e); }); 
    return g; 
  }, [schedule]);
  
  const getTruckById = (id: string | null, entry?: ScheduleEntry) => {
    if (!id && entry?.otherTruckName) {
      return { id: 'other', name: entry.otherTruckName, description: '', cuisineType: '' } as Truck;
    }
    return scheduleTrucks.find(t => t.id === id);
  };
  const getVenueById = (id: string | null, entry?: ScheduleEntry) => {
    if (!id && entry?.otherVenueName) {
      return { id: 'other', name: entry.otherVenueName, description: '', address: '', lat: 0, lng: 0, type: '' } as Venue;
    }
    return scheduleVenues.find(v => v.id === id);
  };

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
          <div className="text-center">
            <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6">What's Rollin' Local</h1>
            <p className="text-xl lg:text-2xl text-ridge-200 mb-8 max-w-2xl mx-auto">Your guide to food trucks, breweries & events in Henderson County</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#schedule" className="px-8 py-4 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg">See Today's Trucks</a>
              <a href="#trucks" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all border border-white/30">Explore All Trucks</a>
            </div>
          </div>
        </div>
      </section>

      <section id="today" className="py-16 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">Where to Find Trucks Today</h2>
            <p className="text-lg text-stone-600">Here's where food trucks are serving right now</p>
          </div>
          {todaysSchedule.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-xl text-stone-500">No trucks scheduled for today.</p>
              <p className="text-stone-400 mt-2">Check the upcoming schedule below!</p>
            </div>
          ) : (
            <MapSection scheduleEntries={todaysSchedule} venues={scheduleVenues} trucks={scheduleTrucks} />
          )}
        </div>
      </section>

      <section id="schedule" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-2">Upcoming Schedule</h2>
              <p className="text-lg text-stone-600">Plan your food truck visits</p>
            </div>
            <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
              <button onClick={() => setScheduleView('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scheduleView === 'list' ? 'bg-white shadow-sm text-ridge-700' : 'text-stone-600 hover:text-stone-900'}`}>List</button>
              <button onClick={() => setScheduleView('calendar')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scheduleView === 'calendar' ? 'bg-white shadow-sm text-ridge-700' : 'text-stone-600 hover:text-stone-900'}`}>Calendar</button>
            </div>
          </div>

          {/* Calendar View */}
          {scheduleView === 'calendar' && (
            <div className="bg-stone-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="font-display text-2xl font-bold text-stone-900">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-stone-500 py-2">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="min-h-[100px]" />;
                  
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const daySchedule = scheduleByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isPast = today && dateStr < today;
                  
                  // Get truck names for this day (max 3 shown)
                  const truckNames = daySchedule.map(entry => {
                    const truck = getTruckById(entry.truckId, entry);
                    return truck?.name || 'Unknown';
                  });
                  const displayedTrucks = truckNames.slice(0, 3);
                  const remainingCount = truckNames.length - 3;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => daySchedule.length > 0 && setSelectedDate(dateStr)}
                      disabled={daySchedule.length === 0}
                      className={`min-h-[100px] p-2 rounded-xl transition-all text-left flex flex-col ${
                        isToday ? 'bg-sunset-500 text-white' :
                        isPast ? 'bg-stone-100 text-stone-400' :
                        daySchedule.length > 0 ? 'bg-ridge-100 hover:bg-ridge-200 text-ridge-700 cursor-pointer' :
                        'bg-white text-stone-400'
                      }`}
                    >
                      <span className="text-sm font-bold">{day.getDate()}</span>
                      {daySchedule.length > 0 && (
                        <div className="mt-1 flex-1 overflow-hidden">
                          {displayedTrucks.map((name, i) => (
                            <div key={i} className={`text-xs truncate ${isToday ? 'text-white/90' : 'text-stone-600'}`}>
                              {name}
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className={`text-xs font-medium mt-1 ${isToday ? 'text-white/75' : 'text-ridge-500'}`}>
                              +{remainingCount} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Date Detail Modal */}
              {selectedDate && scheduleByDate[selectedDate] && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 z-40"
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
                          const truck = getTruckById(entry.truckId, entry);
                          const venue = getVenueById(entry.venueId, entry);
                          if (!truck || !venue) return null;
                          return (
                            <div key={entry.id} className="bg-stone-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-3xl">🚚</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-stone-900 text-lg">{truck.name}</div>
                                  <div className="text-sm text-stone-500">{truck.cuisineType || ''}</div>
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
                              {venue.lat && venue.lng ? (
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-ridge-600 hover:bg-ridge-700 text-white text-sm font-medium rounded-lg transition-colors text-center shrink-0"
                              >
                                Get Directions
                              </a>
                              ) : null}
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
            <div suppressHydrationWarning>
              {Object.keys(scheduleByDate).filter(date => !today || (date >= today && date <= twoWeeksFromToday)).length === 0 ? (
                <p className="text-center text-stone-500 py-12">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(scheduleByDate)
                    .filter(([date]) => !today || (date >= today && date <= twoWeeksFromToday))
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
                              const truck = getTruckById(entry.truckId, entry); 
                              const venue = getVenueById(entry.venueId, entry); 
                              if (!truck || !venue) return null; 
                              return <ScheduleCard key={entry.id} entry={entry} truck={truck} venue={venue} showDate={false} compact />; 
                            })}
                          </div>
                        </div>
                      );
                    })}
                  {/* Show message about more dates in calendar */}
                  <div className="text-center py-4">
                    <p className="text-stone-500 text-sm">Looking further ahead? <button onClick={() => setScheduleView('calendar')} className="text-ridge-600 font-medium hover:underline">Switch to calendar view</button> to see all scheduled dates.</p>
                  </div>
                </div>
              )}
            </div>
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
