// app/api/airtable-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  fetchAirtableSchedule, 
  fetchAirtableTrucks, 
  fetchAirtableVenues, 
  fetchAirtableTrucksForSync,
  fetchAirtableVenuesForSync,
  markRecordsAsSynced,
  markRecordsAsSyncedInTable,
  AirtableScheduleEntry 
} from '@/lib/airtable';
import { getTrucks, getVenues } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Create a Supabase client with service role for bypassing RLS
const supabaseUrl = 'https://bnmgkgjnkupookrttsfu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to convert time formats to HH:MM:SS
function normalizeTime(time: string | null): string | null {
  if (!time) return null;
  
  // Handle various formats: "4:00 PM", "4 PM", "16:00", "4:00pm", etc.
  const trimmed = time.trim().toUpperCase();
  
  // Check for AM/PM format
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2] || '00';
    const period = ampmMatch[3];
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  // Check for 24-hour format: "16:00"
  const militaryMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1]);
    const minutes = militaryMatch[2];
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  return null;
}

// Fuzzy match truck name
function findMatchingTruck(airtableName: string | null, supabaseTrucks: any[]): any | null {
  if (!airtableName) return null;
  
  const normalized = airtableName.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = supabaseTrucks.find(t => 
    t.name.toLowerCase().trim() === normalized
  );
  if (exactMatch) return exactMatch;
  
  // Try partial match
  const partialMatch = supabaseTrucks.find(t => 
    t.name.toLowerCase().includes(normalized) || 
    normalized.includes(t.name.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  return null;
}

// Fuzzy match venue name  
function findMatchingVenue(airtableName: string | null, supabaseVenues: any[]): any | null {
  if (!airtableName) return null;
  
  const normalized = airtableName.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = supabaseVenues.find(v => 
    v.name.toLowerCase().trim() === normalized
  );
  if (exactMatch) return exactMatch;
  
  // Try partial match
  const partialMatch = supabaseVenues.find(v => 
    v.name.toLowerCase().includes(normalized) || 
    normalized.includes(v.name.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  return null;
}

export interface SyncPreviewItem {
  airtableId: string;
  airtableName: string;
  truckName: string | null;
  venueName: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  eventName: string | null;
  matchedTruck: { id: string; name: string } | null;
  matchedVenue: { id: string; name: string } | null;
  status: 'ready' | 'missing_truck' | 'missing_venue' | 'missing_date' | 'missing_time' | 'error';
  error?: string;
}

// GET: Fetch preview of what will be synced
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unsyncedOnly = searchParams.get('unsynced') !== 'false';
    const syncType = searchParams.get('type') || 'schedule'; // 'schedule', 'trucks', or 'venues'
    
    if (syncType === 'trucks') {
      // Fetch trucks for sync preview
      const [airtableTrucks, supabaseTrucks] = await Promise.all([
        fetchAirtableTrucksForSync(unsyncedOnly),
        getTrucks(),
      ]);
      
      const preview = airtableTrucks.map(truck => {
        const existsInSupabase = supabaseTrucks.some(st => 
          st.name.toLowerCase().trim() === truck.name.toLowerCase().trim()
        );
        
        return {
          airtableId: truck.airtableId,
          name: truck.name,
          cuisine: truck.cuisine,
          phone: truck.phone,
          facebook: truck.facebook,
          instagram: truck.instagram,
          website: truck.website,
          existsInSupabase,
          status: existsInSupabase ? 'exists' : 'ready',
        };
      });
      
      return NextResponse.json({
        success: true,
        type: 'trucks',
        preview,
        summary: {
          total: preview.length,
          ready: preview.filter(p => p.status === 'ready').length,
          exists: preview.filter(p => p.status === 'exists').length,
        }
      });
    }
    
    if (syncType === 'venues') {
      // Fetch venues for sync preview
      const [airtableVenues, supabaseVenues] = await Promise.all([
        fetchAirtableVenuesForSync(unsyncedOnly),
        getVenues(),
      ]);
      
      const preview = airtableVenues.map(venue => {
        const existsInSupabase = supabaseVenues.some(sv => 
          sv.name.toLowerCase().trim() === venue.name.toLowerCase().trim()
        );
        
        return {
          airtableId: venue.airtableId,
          name: venue.name,
          type: venue.type,
          address: venue.address,
          latitude: venue.latitude,
          longitude: venue.longitude,
          phone: venue.phone,
          website: venue.website,
          existsInSupabase,
          status: existsInSupabase ? 'exists' : 'ready',
        };
      });
      
      return NextResponse.json({
        success: true,
        type: 'venues',
        preview,
        summary: {
          total: preview.length,
          ready: preview.filter(p => p.status === 'ready').length,
          exists: preview.filter(p => p.status === 'exists').length,
        }
      });
    }
    
    // Default: schedule sync
    // Fetch data from both sources
    const [airtableSchedule, airtableTrucks, airtableVenues, supabaseTrucks, supabaseVenues] = await Promise.all([
      fetchAirtableSchedule(unsyncedOnly),
      fetchAirtableTrucks(),
      fetchAirtableVenues(),
      getTrucks(),
      getVenues(),
    ]);

    // Build preview with matching
    const preview: SyncPreviewItem[] = airtableSchedule.map(entry => {
      // Resolve truck name from Airtable linked record
      let truckName = entry.truckName;
      let isOtherTruck = false;
      
      if (truckName) {
        // Check if it's an Airtable record ID (starts with "rec")
        const airtableTruck = airtableTrucks.find(t => t.id === truckName);
        if (airtableTruck) {
          truckName = airtableTruck.name;
          // Check if it's the "Other" placeholder
          if (truckName.toLowerCase() === 'other') {
            isOtherTruck = true;
            truckName = entry.otherTruckName; // Use the other truck name field
          }
        }
      }

      // Resolve venue name from Airtable linked record
      let venueName = entry.venue;
      let isOtherVenue = false;
      
      if (venueName) {
        // Check if it's an Airtable record ID (starts with "rec")
        const airtableVenue = airtableVenues.find(v => v.id === venueName);
        if (airtableVenue) {
          venueName = airtableVenue.name;
          // Check if it's the "Other" placeholder
          if (venueName.toLowerCase() === 'other') {
            isOtherVenue = true;
            venueName = entry.otherVenueName; // Use the other venue name field
          }
        }
      }

      const matchedTruck = isOtherTruck ? null : findMatchingTruck(truckName, supabaseTrucks);
      const matchedVenue = isOtherVenue ? null : findMatchingVenue(venueName, supabaseVenues);
      
      let status: SyncPreviewItem['status'] = 'ready';
      
      if (!entry.date) {
        status = 'missing_date';
      } else if (!entry.startTime || !entry.endTime) {
        status = 'missing_time';
      } else if (!matchedTruck && !isOtherTruck && truckName) {
        status = 'missing_truck';
      } else if (!matchedVenue && !isOtherVenue && venueName) {
        status = 'missing_venue';
      } else if (!truckName && !entry.otherTruckName) {
        status = 'missing_truck';
      }

      return {
        airtableId: entry.airtableId,
        airtableName: entry.name,
        truckName: isOtherTruck ? entry.otherTruckName : truckName,
        venueName: isOtherVenue ? entry.otherVenueName : venueName,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        eventName: entry.eventName,
        matchedTruck: matchedTruck ? { id: matchedTruck.id, name: matchedTruck.name } : null,
        matchedVenue: matchedVenue ? { id: matchedVenue.id, name: matchedVenue.name } : null,
        status,
        isOtherTruck,
        isOtherVenue,
      } as SyncPreviewItem;
    });

    return NextResponse.json({ 
      success: true,
      type: 'schedule',
      preview,
      summary: {
        total: preview.length,
        ready: preview.filter(p => p.status === 'ready').length,
        issues: preview.filter(p => p.status !== 'ready').length,
      }
    });
  } catch (error) {
    console.error('Airtable sync preview error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST: Execute the sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, type = 'schedule' } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    // Handle truck sync
    if (type === 'trucks') {
      const airtableTrucks = await fetchAirtableTrucksForSync(false);
      const results: { airtableId: string; success: boolean; error?: string }[] = [];
      const successfulIds: string[] = [];

      for (const item of items) {
        const { airtableId } = item;
        
        try {
          const truck = airtableTrucks.find(t => t.airtableId === airtableId);
          if (!truck) {
            results.push({ airtableId, success: false, error: 'Truck not found in Airtable' });
            continue;
          }

          const truckData = {
            name: truck.name,
            cuisine_type: truck.cuisine,
            phone: truck.phone,
            facebook: truck.facebook,
            instagram: truck.instagram,
            website: truck.website,
            is_visible: true,
          };

          const { error: insertError } = await supabaseAdmin.from('trucks').insert(truckData);
          
          if (insertError) {
            throw insertError;
          }

          successfulIds.push(airtableId);
          results.push({ airtableId, success: true });
        } catch (error) {
          console.error('Sync error for truck', airtableId, ':', error);
          results.push({ 
            airtableId, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Mark successful entries as synced
      if (successfulIds.length > 0) {
        try {
          await markRecordsAsSyncedInTable('Trucks', successfulIds);
        } catch (error) {
          console.error('Failed to mark trucks as synced:', error);
        }
      }

      return NextResponse.json({ 
        success: true,
        type: 'trucks',
        results,
        summary: {
          total: items.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        }
      });
    }

    // Handle venue sync
    if (type === 'venues') {
      const airtableVenues = await fetchAirtableVenuesForSync(false);
      const results: { airtableId: string; success: boolean; error?: string }[] = [];
      const successfulIds: string[] = [];

      for (const item of items) {
        const { airtableId } = item;
        
        try {
          const venue = airtableVenues.find(v => v.airtableId === airtableId);
          if (!venue) {
            results.push({ airtableId, success: false, error: 'Venue not found in Airtable' });
            continue;
          }

          const venueData = {
            name: venue.name,
            venue_type: venue.type,
            address: venue.address,
            latitude: venue.latitude,
            longitude: venue.longitude,
            phone: venue.phone,
            website: venue.website,
            is_visible: true,
          };

          const { error: insertError } = await supabaseAdmin.from('venues').insert(venueData);
          
          if (insertError) {
            throw insertError;
          }

          successfulIds.push(airtableId);
          results.push({ airtableId, success: true });
        } catch (error) {
          console.error('Sync error for venue', airtableId, ':', error);
          results.push({ 
            airtableId, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Mark successful entries as synced
      if (successfulIds.length > 0) {
        try {
          await markRecordsAsSyncedInTable('Venues', successfulIds);
        } catch (error) {
          console.error('Failed to mark venues as synced:', error);
        }
      }

      return NextResponse.json({ 
        success: true,
        type: 'venues',
        results,
        summary: {
          total: items.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        }
      });
    }

    // Default: schedule sync
    // Fetch current data
    const [airtableSchedule, airtableTrucks, airtableVenues, supabaseTrucks, supabaseVenues] = await Promise.all([
      fetchAirtableSchedule(false), // Fetch all to find the items
      fetchAirtableTrucks(),
      fetchAirtableVenues(),
      getTrucks(),
      getVenues(),
    ]);

    const results: { airtableId: string; success: boolean; error?: string }[] = [];
    const successfulIds: string[] = [];

    for (const item of items) {
      const { airtableId, truckId, venueId } = item;
      
      try {
        const airtableEntry = airtableSchedule.find(e => e.airtableId === airtableId);
        if (!airtableEntry) {
          results.push({ airtableId, success: false, error: 'Entry not found in Airtable' });
          continue;
        }

        // Resolve truck
        let finalTruckId = truckId;
        let otherTruckName: string | null = null;
        
        if (!finalTruckId && airtableEntry.truckName) {
          let truckName = airtableEntry.truckName;
          const airtableTruck = airtableTrucks.find(t => t.id === truckName);
          if (airtableTruck) {
            truckName = airtableTruck.name;
            // Check if it's the "Other" placeholder
            if (truckName.toLowerCase() === 'other') {
              otherTruckName = airtableEntry.otherTruckName;
              finalTruckId = null;
            } else {
              const matchedTruck = findMatchingTruck(truckName, supabaseTrucks);
              finalTruckId = matchedTruck?.id || null;
            }
          } else {
            const matchedTruck = findMatchingTruck(truckName, supabaseTrucks);
            finalTruckId = matchedTruck?.id || null;
          }
        }

        // Resolve venue
        let finalVenueId = venueId;
        let otherVenueName: string | null = null;
        
        if (!finalVenueId && airtableEntry.venue) {
          let venueName = airtableEntry.venue;
          const airtableVenue = airtableVenues.find(v => v.id === venueName);
          if (airtableVenue) {
            venueName = airtableVenue.name;
            // Check if it's the "Other" placeholder
            if (venueName.toLowerCase() === 'other') {
              otherVenueName = airtableEntry.otherVenueName;
              finalVenueId = null;
            } else {
              const matchedVenue = findMatchingVenue(venueName, supabaseVenues);
              finalVenueId = matchedVenue?.id || null;
            }
          } else {
            const matchedVenue = findMatchingVenue(venueName, supabaseVenues);
            finalVenueId = matchedVenue?.id || null;
          }
        }

        // Normalize times
        const startTime = normalizeTime(airtableEntry.startTime);
        const endTime = normalizeTime(airtableEntry.endTime);

        console.log('Processing entry:', {
          airtableId,
          date: airtableEntry.date,
          rawStartTime: airtableEntry.startTime,
          rawEndTime: airtableEntry.endTime,
          normalizedStartTime: startTime,
          normalizedEndTime: endTime,
          truckName: airtableEntry.truckName,
          venue: airtableEntry.venue,
          finalTruckId,
          finalVenueId,
          otherTruckName,
          otherVenueName,
        });

        if (!airtableEntry.date || !startTime || !endTime) {
          results.push({ airtableId, success: false, error: `Missing date or time. Date: ${airtableEntry.date}, Start: ${startTime}, End: ${endTime}` });
          continue;
        }

        // Create schedule entry in Supabase
        const entryData = {
          truck_id: finalTruckId || null,
          venue_id: finalVenueId || null,
          date: airtableEntry.date,
          start_time: startTime,
          end_time: endTime,
          event_name: airtableEntry.eventName || null,
          other_truck_name: otherTruckName || null,
          other_venue_name: otherVenueName || null,
        };
        
        console.log('Inserting entry:', entryData);
        
        const { error: insertError } = await supabaseAdmin.from('schedule').insert(entryData);
        
        if (insertError) {
          throw insertError;
        }

        successfulIds.push(airtableId);
        results.push({ airtableId, success: true });
      } catch (error) {
        console.error('Sync error for', airtableId, ':', error);
        results.push({ 
          airtableId, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) || 'Unknown error' 
        });
      }
    }

    // Mark successful entries as synced in Airtable
    if (successfulIds.length > 0) {
      try {
        await markRecordsAsSynced(successfulIds);
      } catch (error) {
        console.error('Failed to mark records as synced:', error);
        // Don't fail the whole operation for this
      }
    }

    return NextResponse.json({ 
      success: true,
      type: 'schedule',
      results,
      summary: {
        total: items.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    });
  } catch (error) {
    console.error('Airtable sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
