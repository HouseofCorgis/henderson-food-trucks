declare global {
  interface Window {
    gtag: (command: string, action: string, params?: Record<string, unknown>) => void;
  }
}

export const trackEvent = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};

// Truck events
export const trackTruckPhoneClick = (truckName: string) => {
  trackEvent('truck_phone_click', { truck_name: truckName });
};

export const trackTruckSocialClick = (truckName: string, platform: 'facebook' | 'instagram') => {
  trackEvent('truck_social_click', { truck_name: truckName, platform });
};

// Venue events
export const trackVenueMapClick = (venueName: string) => {
  trackEvent('venue_map_click', { venue_name: venueName });
};

export const trackVenueWebsiteClick = (venueName: string, url: string) => {
  trackEvent('venue_website_click', { venue_name: venueName, website_url: url });
};

// Filter events
export const trackCuisineFilter = (cuisineType: string) => {
  trackEvent('cuisine_filter', { cuisine_type: cuisineType });
};

// CTA events
export const trackCtaClick = (ctaName: string) => {
  trackEvent('cta_click', { cta_name: ctaName });
};
