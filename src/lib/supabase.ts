import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnmgkgjnkupookrttsfu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWdrZ2pua3Vwb29rcnR0c2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzgwNTEsImV4cCI6MjA4MDkxNDA1MX0.Jzvrb8y-sFk4919j8gYDriI9TGm7-le-2fU80k_BLUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Truck {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
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
  // Use Eastern Time for "today" calculation
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
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
