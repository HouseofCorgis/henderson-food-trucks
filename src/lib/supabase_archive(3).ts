import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnmgkgjnkupookrttsfu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWdrZ2pua3Vwb29rcnR0c2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzgwNTEsImV4cCI6MjA4MDkxNDA1MX0.Jzvrb8y-sFk4919j8gYDriI9TGm7-le-2fU80k_BLUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

export interface ScheduleEntry {
  id: string;
  truck_id: string;
  venue_id: string;
  date: string;
  start_time: string;
  end_time: string;
  event_name: string | null;
  other_truck_name?: string | null;
  other_venue_name?: string | null;
}

export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from('trucks').select('*').order('name');
  if (error) { console.error('Error fetching trucks:', error); return []; }
  return data || [];
}

export async function getVenues(): Promise<Venue[]> {
  const { data, error } = await supabase.from('venues').select('*').order('name');
  if (error) { console.error('Error fetching venues:', error); return []; }
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
