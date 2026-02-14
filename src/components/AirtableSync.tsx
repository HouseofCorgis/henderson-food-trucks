'use client';

import { useState } from 'react';

interface SyncPreviewItem {
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
}

interface SyncSummary {
  total: number;
  ready: number;
  issues: number;
}

export default function AirtableSync() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState<SyncPreviewItem[] | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ successful: number; failed: number } | null>(null);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setSummary(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/airtable-sync?unsynced=true');
      const data = await response.json();

      if (data.success) {
        setPreview(data.preview);
        setSummary(data.summary);
        // Auto-select all ready items
        const readyIds = new Set<string>(data.preview.filter((p: SyncPreviewItem) => p.status === 'ready').map((p: SyncPreviewItem) => p.airtableId));
        setSelectedItems(readyIds);
      } else {
        setError(data.error || 'Failed to fetch preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Airtable');
    } finally {
      setLoading(false);
    }
  };

  const executeSync = async () => {
    if (selectedItems.size === 0) return;

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const items = Array.from(selectedItems).map(airtableId => ({ airtableId }));
      
      const response = await fetch('/api/airtable-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          successful: data.summary.successful,
          failed: data.summary.failed,
        });
        // Clear preview after successful sync
        if (data.summary.failed === 0) {
          setPreview(null);
          setSummary(null);
          setSelectedItems(new Set());
        } else {
          // Refresh preview to show remaining items
          await fetchPreview();
        }
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAllReady = () => {
    if (preview) {
      const readyIds = new Set<string>(preview.filter(p => p.status === 'ready').map(p => p.airtableId));
      setSelectedItems(readyIds);
    }
  };

  const selectNone = () => {
    setSelectedItems(new Set());
  };

  const getStatusBadge = (status: SyncPreviewItem['status']) => {
    switch (status) {
      case 'ready':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ready</span>;
      case 'missing_truck':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">No Truck Match</span>;
      case 'missing_venue':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">No Venue Match</span>;
      case 'missing_date':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Missing Date</span>;
      case 'missing_time':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Missing Time</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Error</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <h2 className="text-xl font-bold">Airtable Sync</h2>
        <p className="text-purple-200 text-sm">Import schedule entries from your Airtable Calendar</p>
      </div>

      <div className="p-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Check for New Entries'}
          </button>

          {preview && preview.length > 0 && (
            <button
              onClick={executeSync}
              disabled={syncing || selectedItems.size === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium rounded-lg transition-colors"
            >
              {syncing ? 'Syncing...' : `Sync ${selectedItems.size} Selected`}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Synced {syncResult.successful} entries successfully!
            {syncResult.failed > 0 && ` (${syncResult.failed} failed)`}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mb-4 p-4 bg-stone-50 rounded-lg">
            <div className="flex gap-6 text-sm">
              <span><strong>{summary.total}</strong> entries found</span>
              <span className="text-green-600"><strong>{summary.ready}</strong> ready to sync</span>
              {summary.issues > 0 && (
                <span className="text-yellow-600"><strong>{summary.issues}</strong> with issues</span>
              )}
            </div>
          </div>
        )}

        {/* Preview Table */}
        {preview && preview.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-stone-700">Preview</h3>
              <div className="flex gap-2 text-sm">
                <button onClick={selectAllReady} className="text-purple-600 hover:underline">Select all ready</button>
                <span className="text-stone-300">|</span>
                <button onClick={selectNone} className="text-purple-600 hover:underline">Select none</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="px-3 py-2 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.size === preview.filter(p => p.status === 'ready').length && selectedItems.size > 0}
                        onChange={(e) => e.target.checked ? selectAllReady() : selectNone()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">Truck</th>
                    <th className="px-3 py-2 text-left">Venue</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {preview.map((item) => (
                    <tr key={item.airtableId} className={`hover:bg-stone-50 ${item.status !== 'ready' ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.airtableId)}
                          onChange={() => toggleItem(item.airtableId)}
                          disabled={item.status === 'missing_date' || item.status === 'missing_time'}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div>{item.truckName || <span className="text-stone-400">—</span>}</div>
                        {item.matchedTruck && (
                          <div className="text-xs text-green-600">✓ {item.matchedTruck.name}</div>
                        )}
                        {item.truckName && !item.matchedTruck && (
                          <div className="text-xs text-yellow-600">Will add as "other" truck</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div>{item.venueName || <span className="text-stone-400">—</span>}</div>
                        {item.matchedVenue && (
                          <div className="text-xs text-green-600">✓ {item.matchedVenue.name}</div>
                        )}
                        {item.venueName && !item.matchedVenue && (
                          <div className="text-xs text-yellow-600">Will add as "other" venue</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {item.date ? new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <span className="text-red-500">Missing</span>}
                      </td>
                      <td className="px-3 py-2">
                        {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : <span className="text-red-500">Missing</span>}
                      </td>
                      <td className="px-3 py-2">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {preview && preview.length === 0 && (
          <div className="text-center py-8 text-stone-500">
            No new entries to sync! All Airtable entries are already marked as synced.
          </div>
        )}

        {!preview && !loading && (
          <div className="text-center py-8 text-stone-500">
            Click "Check for New Entries" to see what can be imported from Airtable.
          </div>
        )}
      </div>
    </div>
  );
}
