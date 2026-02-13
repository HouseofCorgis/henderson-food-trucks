'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  supabase, 
  Truck, 
  Venue, 
  ScheduleEntry, 
  addTruck, 
  updateTruck, 
  deleteTruck, 
  addVenue, 
  updateVenue, 
  deleteVenue, 
  addScheduleEntry, 
  updateScheduleEntry, 
  deleteScheduleEntry,
  getCurrentUser,
  signOut,
  isSuperAdmin,
  getTrucksForUser,
  getScheduleForUser,
  assignTruckToUser,
  unassignTruckFromUser,
  SUPER_ADMIN_EMAIL
} from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type Tab = 'trucks' | 'venues' | 'schedule' | 'users';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [allTrucks, setAllTrucks] = useState<Truck[]>([]); // For super admin
  const [venues, setVenues] = useState<Venue[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const isAdmin = isSuperAdmin(user?.email);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    await loadData(currentUser);
  }

  async function loadData(currentUser: User) {
    setLoading(true);
    const userEmail = currentUser.email || '';
    
    // Load venues (everyone can see all venues)
    const { data: v } = await supabase.from('venues').select('*').order('name');
    setVenues(v || []);
    
    // Load trucks based on user role
    const userTrucks = await getTrucksForUser(userEmail);
    setTrucks(userTrucks);
    
    // Super admin gets all trucks for the users tab
    if (isSuperAdmin(userEmail)) {
      const { data: allT } = await supabase.from('trucks').select('*').order('name');
      setAllTrucks(allT || []);
    }
    
    // Load schedule based on user role
    const truckIds = userTrucks.map(t => t.id);
    const userSchedule = await getScheduleForUser(userEmail, truckIds);
    setSchedule(userSchedule);
    
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/admin/login');
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function downloadUsageReport() {
    if (!isAdmin) return;
    
    showMessage('Generating report...');
    
    try {
      // Get all schedule entries
      const { data: allSchedule } = await supabase
        .from('schedule')
        .select('*')
        .order('date', { ascending: false });
      
      if (!allSchedule) {
        showMessage('No data to report');
        return;
      }

      // Calculate truck usage
      const truckUsage = new Map<string, { 
        name: string; 
        type: string; 
        count: number; 
        firstDate: string; 
        lastDate: string;
      }>();

      allSchedule.forEach(entry => {
        const truckName = entry.truck_id 
          ? trucks.find(t => t.id === entry.truck_id)?.name || 'Unknown'
          : entry.other_truck_name || 'Unknown';
        const truckType = entry.truck_id ? 'Official' : 'Other';
        const key = `${truckType}:${truckName}`;
        
        if (!truckUsage.has(key)) {
          truckUsage.set(key, { 
            name: truckName, 
            type: truckType, 
            count: 0, 
            firstDate: entry.date,
            lastDate: entry.date
          });
        }
        
        const usage = truckUsage.get(key)!;
        usage.count++;
        if (entry.date < usage.firstDate) usage.firstDate = entry.date;
        if (entry.date > usage.lastDate) usage.lastDate = entry.date;
      });

      // Calculate venue usage
      const venueUsage = new Map<string, { 
        name: string; 
        type: string; 
        count: number; 
        firstDate: string; 
        lastDate: string;
      }>();

      allSchedule.forEach(entry => {
        const venueName = entry.venue_id 
          ? venues.find(v => v.id === entry.venue_id)?.name || 'Unknown'
          : entry.other_venue_name || 'Unknown';
        const venueType = entry.venue_id ? 'Official' : 'Other';
        const key = `${venueType}:${venueName}`;
        
        if (!venueUsage.has(key)) {
          venueUsage.set(key, { 
            name: venueName, 
            type: venueType, 
            count: 0, 
            firstDate: entry.date,
            lastDate: entry.date
          });
        }
        
        const usage = venueUsage.get(key)!;
        usage.count++;
        if (entry.date < usage.firstDate) usage.firstDate = entry.date;
        if (entry.date > usage.lastDate) usage.lastDate = entry.date;
      });

      // Calculate average per month and status
      const calculateMonthlyAvg = (firstDate: string, lastDate: string, count: number) => {
        const first = new Date(firstDate);
        const last = new Date(lastDate);
        const monthsDiff = (last.getFullYear() - first.getFullYear()) * 12 + 
                          (last.getMonth() - first.getMonth()) + 1;
        return (count / monthsDiff).toFixed(1);
      };

      const isActive = (lastDate: string) => {
        const today = new Date();
        const last = new Date(lastDate);
        const daysDiff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 60 ? 'Active' : 'Inactive';
      };

      // Build CSV content
      let csv = 'TRUCK USAGE REPORT\n\n';
      csv += 'Truck Name,Type,Total Times Scheduled,First Date,Last Date,Avg Per Month,Status\n';
      
      const sortedTrucks = Array.from(truckUsage.values())
        .sort((a, b) => b.count - a.count);
      
      sortedTrucks.forEach(truck => {
        csv += `"${truck.name}",${truck.type},${truck.count},${truck.firstDate},${truck.lastDate},${calculateMonthlyAvg(truck.firstDate, truck.lastDate, truck.count)},${isActive(truck.lastDate)}\n`;
      });

      csv += '\n\nVENUE USAGE REPORT\n\n';
      csv += 'Venue Name,Type,Total Times Used,First Date,Last Date,Avg Per Month,Status\n';
      
      const sortedVenues = Array.from(venueUsage.values())
        .sort((a, b) => b.count - a.count);
      
      sortedVenues.forEach(venue => {
        csv += `"${venue.name}",${venue.type},${venue.count},${venue.firstDate},${venue.lastDate},${calculateMonthlyAvg(venue.firstDate, venue.lastDate, venue.count)},${isActive(venue.lastDate)}\n`;
      });

      // Add summary
      csv += '\n\nSUMMARY\n\n';
      csv += `Total Trucks (Official),${sortedTrucks.filter(t => t.type === 'Official').length}\n`;
      csv += `Total Trucks (Other),${sortedTrucks.filter(t => t.type === 'Other').length}\n`;
      csv += `Total Venues (Official),${sortedVenues.filter(v => v.type === 'Official').length}\n`;
      csv += `Total Venues (Other),${sortedVenues.filter(v => v.type === 'Other').length}\n`;
      csv += `Total Schedule Entries,${allSchedule.length}\n`;

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showMessage('Report downloaded!');
    } catch (err) {
      console.error('Error generating report:', err);
      showMessage('Error generating report');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-xl text-stone-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-ridge-700 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">🚚 Food Truck Admin</h1>
            <p className="text-ridge-200 text-sm">
              {isAdmin ? '👑 Super Admin' : `Managing: ${trucks.map(t => t.name).join(', ') || 'No trucks assigned'}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-ridge-200 text-sm hidden sm:block">{user.email}</span>
            {isAdmin && (
              <button
                onClick={downloadUsageReport}
                className="px-4 py-2 bg-sunset-600 hover:bg-sunset-500 rounded-lg text-sm transition-colors"
              >
                📊 Download Report
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-ridge-600 hover:bg-ridge-500 rounded-lg text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="bg-green-500 text-white p-3 text-center font-medium">{message}</div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-6">
          {(['schedule', 'trucks', ...(isAdmin ? ['venues', 'users'] : [])] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-ridge-600 text-white shadow-md' 
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {tab === 'users' ? '👥 Manage Users' : tab} 
              {tab === 'trucks' && ` (${trucks.length})`}
              {tab === 'venues' && ` (${venues.length})`}
              {tab === 'schedule' && ` (${schedule.length})`}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <a href="/" className="text-ridge-600 hover:text-ridge-700 text-sm">
            ← Back to site
          </a>
        </div>

        {activeTab === 'trucks' && (
          <TrucksTab 
            trucks={trucks} 
            isAdmin={isAdmin} 
            onUpdate={() => user && loadData(user)} 
            showMessage={showMessage} 
          />
        )}
        {activeTab === 'venues' && isAdmin && (
          <VenuesTab 
            venues={venues} 
            onUpdate={() => user && loadData(user)} 
            showMessage={showMessage} 
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab 
            schedule={schedule} 
            trucks={trucks} 
            venues={venues} 
            isAdmin={isAdmin}
            onUpdate={() => user && loadData(user)} 
            showMessage={showMessage} 
          />
        )}
        {activeTab === 'users' && isAdmin && (
          <UsersTab 
            trucks={allTrucks} 
            onUpdate={() => user && loadData(user)} 
            showMessage={showMessage} 
          />
        )}
      </div>
    </div>
  );
}

// ============ TRUCKS TAB ============
function TrucksTab({ trucks, isAdmin, onUpdate, showMessage }: { 
  trucks: Truck[]; 
  isAdmin: boolean;
  onUpdate: () => void; 
  showMessage: (m: string) => void 
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', cuisine_type: '', phone: '', facebook: '', instagram: '' });

  const cuisineTypes = ['BBQ', 'Mexican', 'Burgers', 'Pizza', 'American', 'Seafood', 'South American', 'Mediterranean', 'Desserts', 'Coffee', 'Indian', 'Other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateTruck(editing, form);
        showMessage('Truck updated!');
      } else if (isAdmin) {
        await addTruck({ ...form, user_id: null });
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

  async function toggleVisibility(truck: Truck) {
    try {
      await updateTruck(truck.id, { is_visible: !truck.is_visible });
      showMessage(truck.is_visible ? 'Truck hidden from public site' : 'Truck now visible on public site');
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

  // Non-admin users without trucks assigned
  if (!isAdmin && trucks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-stone-500">No trucks assigned to your account yet.</p>
        <p className="text-stone-400 text-sm mt-2">Contact the admin to get your truck linked.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">
            {editing ? 'Edit Truck' : (isAdmin ? 'Add New Truck' : 'Edit Your Truck')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <input 
                type="text" 
                required 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                disabled={!isAdmin && !editing}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500 disabled:bg-stone-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                rows={2} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cuisine Type</label>
              <select 
                value={form.cuisine_type} 
                onChange={e => setForm({ ...form, cuisine_type: e.target.value })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
              >
                <option value="">Select...</option>
                {cuisineTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input 
                type="tel" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" 
                placeholder="(828) 555-0100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Facebook URL</label>
              <input 
                type="url" 
                value={form.facebook} 
                onChange={e => setForm({ ...form, facebook: e.target.value })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" 
                placeholder="https://facebook.com/..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Instagram URL</label>
              <input 
                type="url" 
                value={form.instagram} 
                onChange={e => setForm({ ...form, instagram: e.target.value })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500" 
                placeholder="https://instagram.com/..." 
              />
            </div>
            <div className="flex gap-2">
              {(isAdmin || editing) && (
                <button 
                  type="submit" 
                  className="flex-1 bg-ridge-600 hover:bg-ridge-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  {editing ? 'Update' : 'Add Truck'}
                </button>
              )}
              {editing && (
                <button 
                  type="button" 
                  onClick={() => { setEditing(null); setForm({ name: '', description: '', cuisine_type: '', phone: '', facebook: '', instagram: '' }); }} 
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="font-bold text-stone-900">
              {isAdmin ? `All Trucks (${trucks.length})` : 'Your Truck'}
            </h2>
          </div>
          {trucks.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No trucks yet. Add your first one!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {trucks.map(truck => (
                <div key={truck.id} className={`p-4 flex items-center justify-between hover:bg-stone-50 ${truck.is_visible === false ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <button
                        onClick={() => toggleVisibility(truck)}
                        title={truck.is_visible === false ? 'Hidden - click to show on public site' : 'Visible - click to hide from public site'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          truck.is_visible === false 
                            ? 'bg-stone-200 text-stone-400' 
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {truck.is_visible === false ? '👁️‍🗨️' : '👁️'}
                      </button>
                    )}
                    <div>
                      <div className="font-semibold text-stone-900">
                        {truck.name}
                        {truck.is_visible === false && <span className="ml-2 text-xs text-stone-400">(hidden)</span>}
                      </div>
                      <div className="text-sm text-stone-500">
                        {truck.cuisine_type || 'No cuisine set'} 
                        {truck.phone && ` • ${truck.phone}`}
                        {truck.user_id && isAdmin && (
                          <span className="ml-2 text-ridge-600">• Assigned to: {truck.user_id}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(truck)} 
                      className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg"
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(truck.id)} 
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                      >
                        Delete
                      </button>
                    )}
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

// ============ VENUES TAB (Admin Only) ============
function VenuesTab({ venues, onUpdate, showMessage }: { 
  venues: Venue[]; 
  onUpdate: () => void; 
  showMessage: (m: string) => void 
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', address: '', lat: '', lng: '', type: 'brewery', phone: '', website: '' });

  const venueTypes = ['brewery', 'winery', 'park', 'event-space', 'market', 'taproom', 'other'];

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

  async function toggleVisibility(venue: Venue) {
    try {
      await updateVenue(venue.id, { is_visible: !venue.is_visible });
      showMessage(venue.is_visible ? 'Venue hidden from public site' : 'Venue now visible on public site');
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
                <div key={venue.id} className={`p-4 flex items-center justify-between hover:bg-stone-50 ${venue.is_visible === false ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleVisibility(venue)}
                      title={venue.is_visible === false ? 'Hidden - click to show on public site' : 'Visible - click to hide from public site'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        venue.is_visible === false 
                          ? 'bg-stone-200 text-stone-400' 
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {venue.is_visible === false ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <div>
                      <div className="font-semibold text-stone-900">
                        {venue.name}
                        {venue.is_visible === false && <span className="ml-2 text-xs text-stone-400">(hidden)</span>}
                      </div>
                      <div className="text-sm text-stone-500">{venue.type} • {venue.address || 'No address'}</div>
                    </div>
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

// ============ SCHEDULE TAB ============
type ScheduleMode = 'single' | 'multiple' | 'recurring';

function ScheduleTab({ schedule, trucks, venues, isAdmin, onUpdate, showMessage }: { 
  schedule: ScheduleEntry[]; 
  trucks: Truck[]; 
  venues: Venue[]; 
  isAdmin: boolean;
  onUpdate: () => void; 
  showMessage: (m: string) => void 
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [mode, setMode] = useState<ScheduleMode>('single');
  const [form, setForm] = useState({ 
    truck_id: '', 
    venue_id: '', 
    date: '', 
    start_time: '16:00', 
    end_time: '20:00', 
    event_name: '',
    other_truck_name: '',
    other_venue_name: ''
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [recurringDay, setRecurringDay] = useState<number>(0);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Auto-select truck if user only has one
  useEffect(() => {
    if (trucks.length === 1 && !form.truck_id) {
      setForm(f => ({ ...f, truck_id: trucks[0].id }));
    }
  }, [trucks, form.truck_id]);

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
    
    while (current.getDay() !== dayOfWeek) {
      current.setDate(current.getDate() + 1);
    }
    
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
      // Validate: if "other" is selected, make sure the name is filled in
      if (form.truck_id === 'other' && !form.other_truck_name.trim()) {
        showMessage('Please enter the truck name');
        return;
      }
      if (form.venue_id === 'other' && !form.other_venue_name.trim()) {
        showMessage('Please enter the venue name');
        return;
      }

      const entryData = {
        truck_id: form.truck_id === 'other' ? null : form.truck_id,
        venue_id: form.venue_id === 'other' ? null : form.venue_id,
        start_time: form.start_time,
        end_time: form.end_time,
        event_name: form.event_name || null,
        other_truck_name: form.truck_id === 'other' ? form.other_truck_name.trim() : null,
        other_venue_name: form.venue_id === 'other' ? form.other_venue_name.trim() : null,
      };

      if (editing) {
        await updateScheduleEntry(editing, { ...entryData, date: form.date });
        showMessage('Schedule updated!');
        setForm({ truck_id: trucks.length === 1 ? trucks[0].id : '', venue_id: '', date: '', start_time: '16:00', end_time: '20:00', event_name: '', other_truck_name: '', other_venue_name: '' });
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
        
        for (const date of datesToAdd) {
          await addScheduleEntry({
            ...entryData,
            date,
          });
        }
        
        showMessage(`Added ${datesToAdd.length} schedule ${datesToAdd.length === 1 ? 'entry' : 'entries'}!`);
        setForm({ truck_id: trucks.length === 1 ? trucks[0].id : '', venue_id: '', date: '', start_time: '16:00', end_time: '20:00', event_name: '', other_truck_name: '', other_venue_name: '' });
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
      truck_id: entry.truck_id || 'other',
      venue_id: entry.venue_id || 'other',
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      event_name: entry.event_name || '',
      other_truck_name: (entry as any).other_truck_name || '',
      other_venue_name: (entry as any).other_venue_name || '',
    });
  }

  const getTruckName = (id: string | null, entry?: ScheduleEntry) => {
    if (!id && entry) {
      return (entry as any).other_truck_name || 'Other Truck';
    }
    return trucks.find(t => t.id === id)?.name || 'Unknown';
  };
  const getVenueName = (id: string | null, entry?: ScheduleEntry) => {
    if (!id && entry) {
      return (entry as any).other_venue_name || 'Other Venue';
    }
    return venues.find(v => v.id === id)?.name || 'Unknown';
  };
  
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t: string) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };

  const upcomingSchedule = schedule.filter(s => s.date >= today);
  const pastSchedule = schedule.filter(s => s.date < today);

  const next30Days = getNextNDays(30);

  // Check if user can add schedule
  if (trucks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-stone-500">No trucks assigned to your account yet.</p>
        <p className="text-stone-400 text-sm mt-2">Contact the admin to get your truck linked.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">{editing ? 'Edit Schedule' : 'Add Schedule Entry'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Truck *</label>
              <select 
                required 
                value={form.truck_id} 
                onChange={e => setForm({ ...form, truck_id: e.target.value, other_truck_name: e.target.value === 'other' ? form.other_truck_name : '' })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
              >
                <option value="">Select a truck...</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="other">➕ Other (one-time)</option>
              </select>
              {form.truck_id === 'other' && (
                <input 
                  type="text" 
                  placeholder="Enter truck name..."
                  value={form.other_truck_name}
                  onChange={e => setForm({ ...form, other_truck_name: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Venue *</label>
              <select 
                required 
                value={form.venue_id} 
                onChange={e => setForm({ ...form, venue_id: e.target.value, other_venue_name: e.target.value === 'other' ? form.other_venue_name : '' })} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
              >
                <option value="">Select a venue...</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                <option value="other">➕ Other (one-time)</option>
              </select>
              {form.venue_id === 'other' && (
                <input 
                  type="text" 
                  placeholder="Enter venue name/location..."
                  value={form.other_venue_name}
                  onChange={e => setForm({ ...form, other_venue_name: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
                  required
                />
              )}
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
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ truck_id: trucks.length === 1 ? trucks[0].id : '', venue_id: '', date: '', start_time: '16:00', end_time: '20:00', event_name: '', other_truck_name: '', other_venue_name: '' }); }} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg">Cancel</button>}
            </div>
          </form>
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
                    <div className="font-semibold text-stone-900">{getTruckName(entry.truck_id, entry)} @ {getVenueName(entry.venue_id, entry)}</div>
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
                    <div className="font-semibold text-stone-500">{getTruckName(entry.truck_id, entry)} @ {getVenueName(entry.venue_id, entry)}</div>
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

// ============ USERS TAB (Admin Only) ============
function UsersTab({ trucks, onUpdate, showMessage }: { 
  trucks: Truck[]; 
  onUpdate: () => void; 
  showMessage: (m: string) => void 
}) {
  const [selectedTruck, setSelectedTruck] = useState('');
  const [email, setEmail] = useState('');

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTruck || !email) return;
    
    try {
      await assignTruckToUser(selectedTruck, email);
      showMessage('Truck assigned to user!');
      setSelectedTruck('');
      setEmail('');
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  async function handleUnassign(truckId: string) {
    if (!confirm('Remove user assignment from this truck?')) return;
    
    try {
      await unassignTruckFromUser(truckId);
      showMessage('User assignment removed');
      onUpdate();
    } catch (err) {
      showMessage('Error: ' + (err as Error).message);
    }
  }

  const assignedTrucks = trucks.filter(t => t.user_id);
  const unassignedTrucks = trucks.filter(t => !t.user_id);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Assign Truck to User</h2>
          <p className="text-sm text-stone-500 mb-4">
            First, invite the user via Supabase Dashboard → Authentication → Users → Invite user.
            Then enter their email below to link them to a truck.
          </p>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Truck</label>
              <select 
                value={selectedTruck} 
                onChange={e => setSelectedTruck(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
              >
                <option value="">Select a truck...</option>
                {unassignedTrucks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">User Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="truckowner@example.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={!selectedTruck || !email}
              className="w-full bg-ridge-600 hover:bg-ridge-700 disabled:bg-stone-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              Assign Truck
            </button>
          </form>
        </div>

        <div className="bg-sunset-50 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-sunset-800 mb-2">📋 How to invite a truck owner:</h3>
          <ol className="text-sm text-sunset-700 space-y-2 list-decimal list-inside">
            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
            <li>Select your project → Authentication → Users</li>
            <li>Click "Invite user" and enter their email</li>
            <li>They'll receive an email to set their password</li>
            <li>Come back here and assign their truck</li>
          </ol>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="font-bold text-stone-900">Assigned Trucks ({assignedTrucks.length})</h2>
          </div>
          {assignedTrucks.length === 0 ? (
            <div className="p-8 text-center text-stone-500">No trucks assigned yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {assignedTrucks.map(truck => (
                <div key={truck.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-semibold text-stone-900">{truck.name}</div>
                    <div className="text-sm text-ridge-600">{truck.user_id}</div>
                  </div>
                  <button 
                    onClick={() => handleUnassign(truck.id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-stone-200">
            <h2 className="font-bold text-stone-900">Unassigned Trucks ({unassignedTrucks.length})</h2>
          </div>
          {unassignedTrucks.length === 0 ? (
            <div className="p-8 text-center text-stone-500">All trucks are assigned!</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {unassignedTrucks.map(truck => (
                <div key={truck.id} className="p-4">
                  <div className="font-semibold text-stone-900">{truck.name}</div>
                  <div className="text-sm text-stone-500">{truck.cuisine_type || 'No cuisine set'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
