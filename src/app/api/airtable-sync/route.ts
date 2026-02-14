// app/api/airtable-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchAirtableSchedule, fetchAirtableTrucks, markRecordsAsSynced, AirtableScheduleEntry } from '@/lib/airtable';
import { getTrucks, getVenues, addScheduleEntry } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
    
    // Fetch data from both sources
    const [airtableSchedule, airtableTrucks, supabaseTrucks, supabaseVenues] = await Promise.all([
      fetchAirtableSchedule(unsyncedOnly),
      fetchAirtableTrucks(),
      getTrucks(),
      getVenues(),
    ]);

    // Build preview with matching
    const preview: SyncPreviewItem[] = airtableSchedule.map(entry => {
      // Resolve truck name from Airtable linked record
      let truckName = entry.truckName;
      if (truckName) {
        // Check if it's an Airtable record ID (starts with "rec")
        const airtableTruck = airtableTrucks.find(t => t.id === truckName);
        if (airtableTruck) {
          truckName = airtableTruck.name;
        }
      }

      const matchedTruck = findMatchingTruck(truckName, supabaseTrucks);
      const matchedVenue = findMatchingVenue(entry.venue, supabaseVenues);
      
      let status: SyncPreviewItem['status'] = 'ready';
      
      if (!matchedTruck && truckName) {
        status = 'missing_truck';
      } else if (!matchedVenue && entry.venue) {
        status = 'missing_venue';
      } else if (!entry.date) {
        status = 'missing_date';
      } else if (!entry.startTime || !entry.endTime) {
        status = 'missing_time';
      } else if (!matchedTruck && !truckName) {
        status = 'missing_truck';
      }

      return {
        airtableId: entry.airtableId,
        airtableName: entry.name,
        truckName,
        venueName: entry.venue,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        eventName: entry.eventName,
        matchedTruck: matchedTruck ? { id: matchedTruck.id, name: matchedTruck.name } : null,
        matchedVenue: matchedVenue ? { id: matchedVenue.id, name: matchedVenue.name } : null,
        status,
      };
    });

    return NextResponse.json({ 
      success: true, 
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
    const { items } = body; // Array of airtableIds to sync, with optional overrides

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    // Fetch current data
    const [airtableSchedule, airtableTrucks, supabaseTrucks, supabaseVenues] = await Promise.all([
      fetchAirtableSchedule(false), // Fetch all to find the items
      fetchAirtableTrucks(),
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
        if (!finalTruckId && airtableEntry.truckName) {
          let truckName = airtableEntry.truckName;
          const airtableTruck = airtableTrucks.find(t => t.id === truckName);
          if (airtableTruck) truckName = airtableTruck.name;
          
          const matchedTruck = findMatchingTruck(truckName, supabaseTrucks);
          finalTruckId = matchedTruck?.id || null;
        }

        // Resolve venue
        let finalVenueId = venueId;
        if (!finalVenueId && airtableEntry.venue) {
          const matchedVenue = findMatchingVenue(airtableEntry.venue, supabaseVenues);
          finalVenueId = matchedVenue?.id || null;
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
          other_truck_name: finalTruckId ? null : (airtableEntry.truckName || null),
          other_venue_name: finalVenueId ? null : (airtableEntry.venue || null),
        };
        
        console.log('Inserting entry:', entryData);
        
        await addScheduleEntry(entryData);

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
