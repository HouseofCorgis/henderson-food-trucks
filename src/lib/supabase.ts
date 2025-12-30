import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnmgkgjnkupookrttsfu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWdrZ2pua3Vwb29rcnR0c2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzgwNTEsImV4cCI6MjA4MDkxNDA1MX0.Jzvrb8y-sFk4919j8gYDriI9TGm7-le-2fU80k_BLUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Super admin email - can see and edit everything
export const SUPER_ADMIN_EMAIL = 'jamminjessjams@gmail.com';

// ============ AUTH FUNCTIONS ============

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function isSuperAdmin(email: string | undefined) {
  return email === SUPER_ADMIN_EMAIL;
}

// Helper function to get today's date in Eastern Time
export function getTodayET(): string {
  const now = new Date();
  // Eastern Time offset: -5 hours (EST) or -4 hours (EDT)
  // Simple DST check: DST is roughly March second Sunday to November first Sunday
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  const hour = now.getUTCHours();
  
  // Determine if DST is in effect (approximate)
  // DST starts second Sunday in March, ends first Sunday in November
  let isDST = false;
  if (month > 2 && month < 10) {
    isDST = true; // April through October
  } else if (month === 2) {
    // March - DST starts second Sunday
    const marchFirst = new Date(year, 2, 1);
    const firstSunday = 1 + (7 - marchFirst.getDay()) % 7;
    const secondSunday = firstSunday + 7;
    if (date > secondSunday || (date === secondSunday && hour >= 7)) {
      isDST = true;
    }
  } else if (month === 10) {
    // November - DST ends first Sunday
    const novFirst = new Date(year, 10, 1);
    const firstSunday = 1 + (7 - novFirst.getDay()) % 7;
    if (date < firstSunday || (date === firstSunday && hour < 6)) {
      isDST = true;
    }
  }
  
  // Apply offset: UTC-4 for EDT, UTC-5 for EST
  const offsetHours = isDST ? 4 : 5;
  const etTime = new Date(now.getTime() - (offsetHours * 60 * 60 * 1000));
  
  // Format as YYYY-MM-DD
  const y = etTime.getUTCFullYear();
  const m = String(etTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(etTime.getUTCDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}

export interface Truck {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  user_id?: string | null;
  is_visible?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  type: string | null;
  phone: string | null;
  website: string | null;
  is_visible?: boolean;
}

export interface ScheduleEntry {
  id: string;
  truck_id: string | null;
  venue_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  event_name: string | null;
  other_truck_name?: string | null;
  other_venue_name?: string | null;
}

// Get ALL trucks (for admin)
export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('trucks').select('*').order('name');
  if (error) { console.error('Error fetching trucks:', error); return []; }
  return data || [];
}

// Get only VISIBLE trucks (for public site)
export async function getVisibleTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('trucks').select('*').eq('is_visible', true).order('name');
  if (error) { console.error('Error fetching visible trucks:', error); return []; }
  return data || [];
}

export async function getVenues(): Promise<Venue[]> {
  const { data, error } = await supabase.from('venues').select('*').order('name');
  if (error) { console.error('Error fetching venues:', error); return []; }
  return data || [];
}

// Get only VISIBLE venues (for public site)
export async function getVisibleVenues(): Promise<Venue[]> {
  const { data, error } = await supabase.from('venues').select('*').eq('is_visible', true).order('name');
  if (error) { console.error('Error fetching visible venues:', error); return []; }
  return data || [];
}
  return data || [];
}

export async function getSchedule(): Promise<ScheduleEntry[]> {
  const today = getTodayET();
  const { data, error } = await supabase.from('schedule').select('*').gte('date', today).order('date').order('start_time');
  if (error) { console.error('Error fetching schedule:', error); return []; }
  return data || [];
}

export async function addTruck(truck: Omit<Truck, 'id'>) {
  const { data, error } = await supabase.from('trucks').insert(truck).select().single();
  if (error) throw error;
  return data;
}

export async function updateTruck(id: string, truck: Partial<Truck>) {
  const { data, error } = await supabase.from('trucks').update(truck).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTruck(id: string) {
  const { error } = await supabase.from('trucks').delete().eq('id', id);
  if (error) throw error;
}

export async function addVenue(venue: Omit<Venue, 'id'>) {
  const { data, error } = await supabase.from('venues').insert(venue).select().single();
  if (error) throw error;
  return data;
}

export async function updateVenue(id: string, venue: Partial<Venue>) {
  const { data, error } = await supabase.from('venues').update(venue).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVenue(id: string) {
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) throw error;
}

export async function addScheduleEntry(entry: Omit<ScheduleEntry, 'id'>) {
  const { data, error } = await supabase.from('schedule').insert(entry).select().single();
  if (error) throw error;
  return data;
}

export async function updateScheduleEntry(id: string, entry: Partial<ScheduleEntry>) {
  const { data, error } = await supabase.from('schedule').update(entry).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteScheduleEntry(id: string) {
  const { error } = await supabase.from('schedule').delete().eq('id', id);
  if (error) throw error;
}

// ============ ADMIN FUNCTIONS ============

// Get trucks for a specific user (or all if super admin)
export async function getTrucksForUser(userEmail: string): Promise<Truck[]> {
  if (isSuperAdmin(userEmail)) {
    return getTrucks();
  }
  
  const { data, error } = await supabase
    .from('trucks')
    .select('*')
    .eq('user_id', userEmail)
    .order('name');
  
  if (error) { console.error('Error fetching trucks for user:', error); return []; }
  return data || [];
}

// Get schedule entries for trucks owned by user (or all if super admin)
export async function getScheduleForUser(userEmail: string, truckIds?: string[]): Promise<ScheduleEntry[]> {
  if (isSuperAdmin(userEmail)) {
    const { data, error } = await supabase.from('schedule').select('*').order('date').order('start_time');
    if (error) { console.error('Error fetching schedule:', error); return []; }
    return data || [];
  }
  
  // Use provided truckIds or fetch them
  let ids = truckIds;
  if (!ids) {
    const trucks = await getTrucksForUser(userEmail);
    ids = trucks.map(t => t.id);
  }
  
  if (ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from('schedule')
    .select('*')
    .in('truck_id', ids)
    .order('date')
    .order('start_time');
  
  if (error) { console.error('Error fetching schedule for user:', error); return []; }
  return data || [];
}

// Assign a truck to a user (super admin only)
export async function assignTruckToUser(truckId: string, userEmail: string) {
  const { data, error } = await supabase
    .from('trucks')
    .update({ user_id: userEmail })
    .eq('id', truckId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Remove user assignment from truck (super admin only)
export async function unassignTruckFromUser(truckId: string) {
  const { data, error } = await supabase
    .from('trucks')
    .update({ user_id: null })
    .eq('id', truckId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
