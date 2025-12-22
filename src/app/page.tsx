import { getTrucks, getVenues, getSchedule } from '@/lib/supabase';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [trucksRaw, venuesRaw, scheduleRaw] = await Promise.all([
    getTrucks(),
    getVenues(),
    getSchedule(),
  ]);

  const trucks = trucksRaw.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || '',
    cuisineType: t.cuisine_type || '',
    phone: t.phone || undefined,
    facebook: t.facebook || undefined,
    instagram: t.instagram || undefined,
  }));

  const venues = venuesRaw.map(v => ({
    id: v.id,
    name: v.name,
    description: v.description || '',
    address: v.address || '',
    lat: v.lat || 0,
    lng: v.lng || 0,
    type: v.type || 'other',
    phone: v.phone || undefined,
    website: v.website || undefined,
  }));

  const schedule = scheduleRaw.map(s => ({
    id: s.id,
    truckId: s.truck_id,
    venueId: s.venue_id,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    eventName: s.event_name || undefined,
    otherTruckName: s.other_truck_name || undefined,
    otherVenueName: s.other_venue_name || undefined,
  }));

  return <HomeClient trucks={trucks} venues={venues} schedule={schedule} />;
}
