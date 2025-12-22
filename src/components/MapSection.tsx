'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Truck { id: string; name: string; cuisineType: string; }
interface Venue { id: string; name: string; address: string; lat: number; lng: number; }
interface Entry { truckId: string | null; venueId: string | null; otherTruckName?: string; otherVenueName?: string; }

export default function MapSection({ scheduleEntries, venues, trucks }: { scheduleEntries: Entry[]; venues: Venue[]; trucks: Truck[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([35.3187, -82.4612], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
    mapRef.current = map;

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    
    // Filter out entries without valid venue IDs (skip "other" venues)
    const entriesWithVenues = scheduleEntries.filter(e => e.venueId !== null);
    
    const byVenue: Record<string, Entry[]> = {};
    entriesWithVenues.forEach(e => { 
      if (!e.venueId) return;
      if (!byVenue[e.venueId]) byVenue[e.venueId] = []; 
      byVenue[e.venueId].push(e); 
    });
    
    const bounds = L.latLngBounds([]);
    
    Object.entries(byVenue).forEach(([venueId, entries]) => {
      const venue = venues.find(v => v.id === venueId);
      if (!venue || !venue.lat || !venue.lng) return;
      
      // Get truck names, handling "other" trucks
      const truckList = entries.map(e => {
        if (e.truckId) {
          return trucks.find(t => t.id === e.truckId);
        } else if (e.otherTruckName) {
          return { id: 'other', name: e.otherTruckName, cuisineType: '' };
        }
        return null;
      }).filter(Boolean);
      
      if (!truckList.length) return;
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:linear-gradient(135deg,#4d7550,#3b5d3e);color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(77,117,80,0.4);border:3px solid white;">🚚</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      
      const popup = `<div style="min-width:200px;font-family:system-ui"><b style="color:#4d7550">${venue.name}</b><br><small>${venue.address}</small><hr style="margin:8px 0">${truckList.map(t => `🚚 <b>${t!.name}</b>${t!.cuisineType ? ` <small>(${t!.cuisineType})</small>` : ''}`).join('<br>')}<br><a href="https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}" target="_blank" style="display:block;text-align:center;background:#4d7550;color:white;padding:8px;border-radius:8px;text-decoration:none;margin-top:8px;font-size:12px">Get Directions</a></div>`;
      
      L.marker([venue.lat, venue.lng], { icon }).addTo(map).bindPopup(popup);
      bounds.extend([venue.lat, venue.lng]);
    });
    
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [scheduleEntries, venues, trucks]);

  // Count only entries that will show on map (have valid venues)
  const mappableEntries = scheduleEntries.filter(e => e.venueId !== null);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[500px] rounded-2xl shadow-lg overflow-hidden" style={{ zIndex: 1 }} />
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-10 flex items-center gap-2 text-ridge-700 font-medium">
        <div className="w-8 h-8 bg-ridge-600 rounded-full flex items-center justify-center text-white text-sm">🚚</div>
        {mappableEntries.length} truck{mappableEntries.length !== 1 ? 's' : ''} today
      </div>
    </div>
  );
}
