// lib/airtable.ts

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface AirtableScheduleEntry {
  airtableId: string;
  name: string;
  truckName: string | null;
  venue: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  eventName: string | null;
  synced: boolean;
}

// Generic function to fetch records from any table
async function fetchAirtableRecords(tableName: string, filterFormula?: string): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);
    if (filterFormula) params.append('filterByFormula', filterFormula);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }

    const data: AirtableResponse = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

// Update a record in Airtable (e.g., to mark as synced)
async function updateAirtableRecord(tableName: string, recordId: string, fields: Record<string, any>): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }
}

// Batch update multiple records
export async function markRecordsAsSynced(recordIds: string[]): Promise<void> {
  // Airtable allows max 10 records per batch update
  const batches = [];
  for (let i = 0; i < recordIds.length; i += 10) {
    batches.push(recordIds.slice(i, i + 10));
  }

  for (const batch of batches) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('Calendar')}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: batch.map(id => ({
          id,
          fields: { 'Synced': true }
        }))
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }
  }
}

// Fetch schedule entries from Airtable Calendar table
export async function fetchAirtableSchedule(unsyncedOnly: boolean = true): Promise<AirtableScheduleEntry[]> {
  const filterFormula = unsyncedOnly ? "NOT({Synced})" : undefined;
  const records = await fetchAirtableRecords('Calendar', filterFormula);

  return records.map(record => {
    // Truck is a linked record, so it comes as an array of record IDs
    // We need to get the name from the linked record
    const truckLink = record.fields['Truck'];
    let truckName: string | null = null;
    
    // If Truck is a linked field, it might be an array of record IDs or have a lookup
    // For now, we'll handle it as either a string or array
    if (Array.isArray(truckLink) && truckLink.length > 0) {
      // It's a linked record - we'll need to resolve this
      // For now, store the ID and we'll match by name in the sync
      truckName = truckLink[0]; // This might be an ID, we'll handle in sync
    } else if (typeof truckLink === 'string') {
      truckName = truckLink;
    }

    // Format date to YYYY-MM-DD if present
    let formattedDate: string | null = null;
    if (record.fields['Date']) {
      const date = new Date(record.fields['Date']);
      formattedDate = date.toISOString().split('T')[0];
    }

    return {
      airtableId: record.id,
      name: record.fields['Name'] || '',
      truckName,
      venue: record.fields['Venue'] || null,
      date: formattedDate,
      startTime: record.fields['Start Time'] || null,
      endTime: record.fields['End Time'] || null,
      eventName: record.fields['Event Name'] || null,
      synced: record.fields['Synced'] || false,
    };
  });
}

// Fetch trucks from Airtable to help with matching
export async function fetchAirtableTrucks(): Promise<{ id: string; name: string }[]> {
  const records = await fetchAirtableRecords('Trucks');
  return records.map(record => ({
    id: record.id,
    name: record.fields['Name'] || '',
  }));
}
