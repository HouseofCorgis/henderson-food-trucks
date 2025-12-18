// Save this as: lib/analytics.ts

import { createClient } from '@supabase/supabase-js';

// Use your existing Supabase client, or create one here
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Event types we track
export type AnalyticsEvent = 
  | 'profile_view'      // Someone viewed a truck's profile page
  | 'map_pin_click'     // Someone clicked a truck's pin on the map
  | 'social_click'      // Someone clicked Instagram/Facebook link
  | 'phone_click'       // Someone clicked the phone number
  | 'website_click'     // Someone clicked the website link
  | 'menu_view'         // Someone expanded/viewed the menu
  | 'directions_click'; // Someone clicked for directions

interface TrackEventParams {
  eventType: AnalyticsEvent;
  truckId: string;
  metadata?: Record<string, any>;
}

export async function trackEvent({ eventType, truckId, metadata = {} }: TrackEventParams) {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        truck_id: truckId,
        metadata: {
          ...metadata,
          // Capture some useful context
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          path: typeof window !== 'undefined' ? window.location.pathname : null,
        }
      });

    if (error) {
      console.error('Analytics error:', error);
    }
  } catch (err) {
    // Fail silently - analytics should never break the app
    console.error('Analytics error:', err);
  }
}

// Convenience functions for common events
export const analytics = {
  profileView: (truckId: string) => 
    trackEvent({ eventType: 'profile_view', truckId }),

  mapPinClick: (truckId: string) => 
    trackEvent({ eventType: 'map_pin_click', truckId }),

  socialClick: (truckId: string, platform: 'instagram' | 'facebook') => 
    trackEvent({ eventType: 'social_click', truckId, metadata: { platform } }),

  phoneClick: (truckId: string) => 
    trackEvent({ eventType: 'phone_click', truckId }),

  websiteClick: (truckId: string) => 
    trackEvent({ eventType: 'website_click', truckId }),

  menuView: (truckId: string) => 
    trackEvent({ eventType: 'menu_view', truckId }),

  directionsClick: (truckId: string) => 
    trackEvent({ eventType: 'directions_click', truckId }),
};
