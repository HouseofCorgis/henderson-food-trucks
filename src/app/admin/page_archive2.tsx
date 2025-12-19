'use client';

import { useState, useEffect } from 'react';
import { supabase, Truck, Venue, ScheduleEntry, addTruck, updateTruck, deleteTruck, addVenue, updateVenue, deleteVenue, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry } from '@/lib/supabase';

type Tab = 'trucks' | 'venues' | 'schedule';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: t }, { data: v }, { data: s }] = await Promise.all([
      supabase.from('trucks').select('*').order('name'),
      supabase.from('venues').select('*').order('name'),
      supabase.from('schedule').select('*').order('date').order('start_time'),
    ]);
    setTrucks(t || []);
    setVenues(v || []);
    setSchedule(s || []);
    setLoading(false);
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-100"><div className="text-xl text-stone-600">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-ridge-700 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">🚚 Food Truck Admin</h1>
          <a href="/" className="text-ridge-200 hover:text-white text-sm">← Back to site</a>
        </div>
      </header>

      {message && (
        <div className="bg-green-500 text-white p-3 text-center font-medium">{message}</div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex gap-2 mb-6">
          {(['schedule', 'trucks', 'venues'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-ridge-600 text-white shadow-md' 
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {tab} ({tab === 'trucks' ? trucks.length : tab === 'venues' ? venues.length : schedule.length})
            </button>
          ))}
        </div>

        {activeTab === 'trucks' && <TrucksTab trucks={trucks} onUpdate={loadData} showMessage={showMessage} />}
        {activeTab === 'venues' && <VenuesTab venues={venues} onUpdate={loadData} showMessage={showMessage} />}
        {activeTab === 'schedule' && <ScheduleTab schedule={schedule} trucks={trucks} venues={venues} onUpdate={loadData} showMessage={showMessage} />}
      </div>
    </div>
  );
}

function TrucksTab({ trucks, onUpdate, showMessage }: { trucks: Truck[]; onUpdate: () => void; showMessage: (m: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', cuisine_type: '', phone: '', facebook: '', instagram: '' });

  const cuisineTypes = ['BBQ', 'Mexican', 'Burgers', 'Pizza', 'American', 'Southern', 'Seafood', 'Vietnamese', 'Korean', 'Mediterranean', 'Vegan', 'Desserts', 'Coffee', 'Other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateTruck(editing, form);
        showMessage('Truck updated!');
      } else {
        await addTruck(form);
        showMessage('Truck added!');
      }
      setForm({ name: '', description: '', cuisine_type: '', phone: '', facebook: '', instagram: '' });
      setEditing(null);
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this truck? This will also delete all their schedule entries.')) return;
    try {
      await deleteTruck(id);
      showMessage('Truck deleted');
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  function startEdit(truck: Truck) {
    setEditing(truck.id);
    setForm({
      name: truck.name,
      description: truck.description || '',
      cuisine_type: truck.cuisine_type || '',
      phone: truck.phone || '',
      facebook: truck.facebook || '',
      instagram: truck.instagram || '',
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">{editing ? 'Edit Truck' : 'Add New Truck'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cuisine Type</label>
              <select value={form.cuisine_type} onChange={e => setForm({ ...form, cuisine_type: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500">
                <option value="">Select...</option>
                {cuisineTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="(828) 555-0100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Facebook URL</label>
              <input type="url" value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Instagram URL</label>
              <input type="url" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="https://instagram.com/..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-ridge-600 hover:bg-ridge-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">{editing ? 'Update' : 'Add Truck'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', cuisine_type: '', phone: '', facebook: '', instagram: '' }); }} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg">Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200"><h2 className="font-bold text-stone-900">All Trucks ({trucks.length})</h2></div>
          {trucks.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No trucks yet. Add your first one!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {trucks.map(truck => (
                <div key={truck.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-semibold text-stone-900">{truck.name}</div>
                    <div className="text-sm text-stone-500">{truck.cuisine_type || 'No cuisine set'} {truck.phone && `• ${truck.phone}`}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(truck)} className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(truck.id)} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VenuesTab({ venues, onUpdate, showMessage }: { venues: Venue[]; onUpdate: () => void; showMessage: (m: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', address: '', lat: '', lng: '', type: 'brewery', phone: '', website: '' });

  const venueTypes = ['brewery', 'winery', 'park', 'event-space', 'market', 'other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = { ...form, lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null };
      if (editing) {
        await updateVenue(editing, data);
        showMessage('Venue updated!');
      } else {
        await addVenue(data);
        showMessage('Venue added!');
      }
      setForm({ name: '', description: '', address: '', lat: '', lng: '', type: 'brewery', phone: '', website: '' });
      setEditing(null);
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this venue?')) return;
    try {
      await deleteVenue(id);
      showMessage('Venue deleted');
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  function startEdit(venue: Venue) {
    setEditing(venue.id);
    setForm({
      name: venue.name,
      description: venue.description || '',
      address: venue.address || '',
      lat: venue.lat?.toString() || '',
      lng: venue.lng?.toString() || '',
      type: venue.type || 'brewery',
      phone: venue.phone || '',
      website: venue.website || '',
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">{editing ? 'Edit Venue' : 'Add New Venue'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500">
                {venueTypes.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="123 Main St, Hendersonville, NC" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Latitude</label>
                <input type="text" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="35.3187" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Longitude</label>
                <input type="text" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="-82.4612" />
              </div>
            </div>
            <p className="text-xs text-stone-500">Tip: Search the address on Google Maps, right-click the location, and copy the coordinates.</p>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
              <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-ridge-600 hover:bg-ridge-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">{editing ? 'Update' : 'Add Venue'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', address: '', lat: '', lng: '', type: 'brewery', phone: '', website: '' }); }} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg">Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200"><h2 className="font-bold text-stone-900">All Venues ({venues.length})</h2></div>
          {venues.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No venues yet. Add your first one!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {venues.map(venue => (
                <div key={venue.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-semibold text-stone-900">{venue.name}</div>
                    <div className="text-sm text-stone-500">{venue.type} • {venue.address || 'No address'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(venue)} className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(venue.id)} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ScheduleMode = 'single' | 'multiple' | 'recurring';

function ScheduleTab({ schedule, trucks, venues, onUpdate, showMessage }: { schedule: ScheduleEntry[]; trucks: Truck[]; venues: Venue[]; onUpdate: () => void; showMessage: (m: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [mode, setMode] = useState<ScheduleMode>('single');
  const [form, setForm] = useState({ 
    truck_id: '', 
    venue_id: '', 
    date: '', 
    start_time: '17:00', 
    end_time: '21:00', 
    event_name: '' 
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [recurringDay, setRecurringDay] = useState<number>(0); // 0 = Sunday, 1 = Monday, etc.
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function getNextNDays(n: number): { date: string; dayName: string; display: string }[] {
    const days = [];
    for (let i = 0; i < n; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayName: dayNames[d.getDay()],
        display: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return days;
  }

  function getRecurringDates(dayOfWeek: number, endDate: string): string[] {
    const dates: string[] = [];
    const end = new Date(endDate + 'T12:00:00');
    const current = new Date();
    
    // Find the next occurrence of the day
    while (current.getDay() !== dayOfWeek) {
      current.setDate(current.getDate() + 1);
    }
    
    // Add all occurrences until end date
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }
    
    return dates;
  }

  function toggleDate(date: string) {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateScheduleEntry(editing, form);
        showMessage('Schedule updated!');
        setForm({ truck_id: '', venue_id: '', date: '', start_time: '17:00', end_time: '21:00', event_name: '' });
        setEditing(null);
      } else {
        let datesToAdd: string[] = [];
        
        if (mode === 'single') {
          datesToAdd = [form.date];
        } else if (mode === 'multiple') {
          datesToAdd = selectedDates;
        } else if (mode === 'recurring') {
          datesToAdd = getRecurringDates(recurringDay, recurringEndDate);
        }
        
        if (datesToAdd.length === 0) {
          showMessage('Please select at least one date');
          return;
        }
        
        // Add entry for each date
        for (const date of datesToAdd) {
          await addScheduleEntry({
            truck_id: form.truck_id,
            venue_id: form.venue_id,
            date,
            start_time: form.start_time,
            end_time: form.end_time,
            event_name: form.event_name || null,
          });
        }
        
        showMessage(`Added ${datesToAdd.length} schedule ${datesToAdd.length === 1 ? 'entry' : 'entries'}!`);
        setForm({ truck_id: '', venue_id: '', date: '', start_time: '17:00', end_time: '21:00', event_name: '' });
        setSelectedDates([]);
        setRecurringEndDate('');
      }
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this schedule entry?')) return;
    try {
      await deleteScheduleEntry(id);
      showMessage('Schedule deleted');
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  function startEdit(entry: ScheduleEntry) {
    setEditing(entry.id);
    setMode('single');
    setForm({
      truck_id: entry.truck_id,
      venue_id: entry.venue_id,
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      event_name: entry.event_name || '',
    });
  }

  const getTruckName = (id: string) => trucks.find(t => t.id === id)?.name || 'Unknown';
  const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || 'Unknown';
  
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t: string) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };

  const upcomingSchedule = schedule.filter(s => s.date >= today);
  const pastSchedule = schedule.filter(s => s.date < today);

  const next30Days = getNextNDays(30);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">{editing ? 'Edit Schedule' : 'Add Schedule Entry'}</h2>
          
          {trucks.length === 0 || venues.length === 0 ? (
            <div className="text-stone-500 text-sm">
              <p className="mb-2">Before adding schedule entries, you need:</p>
              <ul className="list-disc list-inside">
                {trucks.length === 0 && <li>At least one truck</li>}
                {venues.length === 0 && <li>At least one venue</li>}
              </ul>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Truck *</label>
                <select required value={form.truck_id} onChange={e => setForm({ ...form, truck_id: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500">
                  <option value="">Select a truck...</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Venue *</label>
                <select required value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500">
                  <option value="">Select a venue...</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              {/* Date Mode Selection - only show when not editing */}
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Date Selection Mode</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMode('single')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'single' ? 'bg-ridge-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      Single
                    </button>
                    <button type="button" onClick={() => setMode('multiple')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'multiple' ? 'bg-ridge-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      Multiple
                    </button>
                    <button type="button" onClick={() => setMode('recurring')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'recurring' ? 'bg-ridge-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      Weekly
                    </button>
                  </div>
                </div>
              )}

              {/* Single Date */}
              {(mode === 'single' || editing) && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min={today} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
                </div>
              )}

              {/* Multiple Dates */}
              {mode === 'multiple' && !editing && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Select Dates ({selectedDates.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-2 space-y-1">
                    {next30Days.map(({ date, display }) => (
                      <label key={date} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedDates.includes(date) ? 'bg-ridge-100' : 'hover:bg-stone-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedDates.includes(date)}
                          onChange={() => toggleDate(date)}
                          className="w-4 h-4 text-ridge-600 rounded focus:ring-ridge-500"
                        />
                        <span className="text-sm">{display}</span>
                      </label>
                    ))}
                  </div>
                  {selectedDates.length > 0 && (
                    <button type="button" onClick={() => setSelectedDates([])} className="mt-2 text-sm text-stone-500 hover:text-stone-700">
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              {/* Recurring Weekly */}
              {mode === 'recurring' && !editing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Every *</label>
                    <select value={recurringDay} onChange={e => setRecurringDay(parseInt(e.target.value))} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500">
                      {dayNames.map((day, i) => <option key={day} value={i}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Until *</label>
                    <input type="date" required={mode === 'recurring'} value={recurringEndDate} onChange={e => setRecurringEndDate(e.target.value)} min={today} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
                    {recurringEndDate && (
                      <p className="mt-1 text-xs text-stone-500">
                        Will create {getRecurringDates(recurringDay, recurringEndDate).length} entries
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Start Time *</label>
                  <input type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">End Time *</label>
                  <input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Event Name (optional)</label>
                <input type="text" value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" placeholder="e.g., Farmers Market, Live Music Night" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-ridge-600 hover:bg-ridge-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
                  {editing ? 'Update' : mode === 'single' ? 'Add to Schedule' : `Add ${mode === 'multiple' ? selectedDates.length : getRecurringDates(recurringDay, recurringEndDate).length || 0} Entries`}
                </button>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm({ truck_id: '', venue_id: '', date: '', start_time: '17:00', end_time: '21:00', event_name: '' }); }} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg">Cancel</button>}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200"><h2 className="font-bold text-stone-900">Upcoming Schedule ({upcomingSchedule.length})</h2></div>
          {upcomingSchedule.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No upcoming schedule. Add some entries!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {upcomingSchedule.map(entry => (
                <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-semibold text-stone-900">{getTruckName(entry.truck_id)} @ {getVenueName(entry.venue_id)}</div>
                    <div className="text-sm text-stone-500">
                      {formatDate(entry.date)} • {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                      {entry.event_name && <span className="ml-2 text-sunset-600">• {entry.event_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(entry)} className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(entry.id)} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pastSchedule.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden opacity-60">
            <div className="p-4 border-b border-stone-200"><h2 className="font-bold text-stone-500">Past Schedule ({pastSchedule.length})</h2></div>
            <div className="divide-y divide-stone-100">
              {pastSchedule.slice(0, 5).map(entry => (
                <div key={entry.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-500">{getTruckName(entry.truck_id)} @ {getVenueName(entry.venue_id)}</div>
                    <div className="text-sm text-stone-400">{formatDate(entry.date)}</div>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-lg">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
