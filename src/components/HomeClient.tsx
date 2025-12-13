'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TruckCard from '@/components/TruckCard';
import ScheduleCard from '@/components/ScheduleCard';
import VenueCard from '@/components/VenueCard';
import { trackCuisineFilter, trackCtaClick } from '@/lib/analytics';

const MapSection = dynamic(() => import('@/components/MapSection'), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-stone-200 animate-pulse rounded-xl flex items-center justify-center"><span className="text-stone-500">Loading map...</span></div>
});

interface Truck { id: string; name: string; description: string; cuisineType: string; phone?: string; facebook?: string; instagram?: string; }
interface Venue { id: string; name: string; description: string; address: string; lat: number; lng: number; type: string; phone?: string; website?: string; }
interface ScheduleEntry { id: string; truckId: string; venueId: string; date: string; startTime: string; endTime: string; eventName?: string; }

export default function HomeClient({ trucks, venues, schedule }: { trucks: Truck[]; venues: Venue[]; schedule: ScheduleEntry[] }) {
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const today = new Date().toISOString().split('T')[0];
  
  const todaysSchedule = useMemo(() => schedule.filter(s => s.date === today), [schedule, today]);
  const upcomingSchedule = useMemo(() => schedule.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [schedule, today]);
  const cuisineTypes = useMemo(() => ['all', ...Array.from(new Set(trucks.map(t => t.cuisineType))).filter(Boolean).sort()], [trucks]);
  const filteredTrucks = useMemo(() => cuisineFilter === 'all' ? trucks : trucks.filter(t => t.cuisineType === cuisineFilter), [trucks, cuisineFilter]);
  const scheduleByDate = useMemo(() => { const g: Record<string, ScheduleEntry[]> = {}; upcomingSchedule.forEach(e => { if (!g[e.date]) g[e.date] = []; g[e.date].push(e); }); return g; }, [upcomingSchedule]);
  
  const getTruckById = (id: string) => trucks.find(t => t.id === id);
  const getVenueById = (id: string) => venues.find(v => v.id === id);

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
              <a href="#today" onClick={() => trackCtaClick('find_trucks_today')} className="inline-flex items-center px-6 py-3 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg">Find Trucks Today</a>
              <a href="#trucks" onClick={() => trackCtaClick('browse_all_trucks')} className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/30">Browse All Trucks</a>
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
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">This Week&apos;s Schedule</h2>
            <p className="text-lg text-stone-600">Plan ahead and never miss your favorite truck</p>
          </div>
          {Object.keys(scheduleByDate).length === 0 ? <p className="text-center text-stone-500 py-12">No upcoming events scheduled.</p> : (
            <div className="space-y-8">
              {Object.entries(scheduleByDate).map(([date, entries]) => {
                const dateObj = new Date(date + 'T12:00:00');
                const isToday = new Date().toDateString() === dateObj.toDateString();
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
                      {entries.map(entry => { const truck = getTruckById(entry.truckId); const venue = getVenueById(entry.venueId); if (!truck || !venue) return null; return <ScheduleCard key={entry.id} entry={entry} truck={truck} venue={venue} showDate={false} compact />; })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="trucks" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-stone-900 mb-4">All Food Trucks</h2>
            <p className="text-lg text-stone-600 mb-8">Explore all the amazing food trucks in WNC</p>
            {cuisineTypes.length > 1 && <div className="flex flex-wrap justify-center gap-2">{cuisineTypes.map(type => <button key={type} onClick={() => { setCuisineFilter(type); trackCuisineFilter(type); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${cuisineFilter === type ? 'bg-ridge-600 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{type === 'all' ? 'All Cuisines' : type}</button>)}</div>}
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
          <a href="mailto:hello@whatsrollinlocal.com?subject=Add My Food Truck" onClick={() => trackCtaClick('contact_us')} className="inline-flex items-center px-8 py-4 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold rounded-full transition-all hover:scale-105 shadow-lg">Contact Us</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
