import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTruckById, getScheduleForTruck, getVenues } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const icons: Record<string, string> = { 
  'BBQ': '🍖', 'Mexican': '🌮', 'Burgers': '🍔', 'Vietnamese': '🍜', 
  'American': '🧀', 'Desserts': '🍦', 'Southern': '🍗', 'Mediterranean': '🥙', 
  'Pizza': '🍕', 'Vegan': '🥗', 'Coffee': '☕', 'Seafood': '🦐', 'Korean': '🍚',
  'Indian': '🍛'
};

export default async function TruckProfilePage({ params }: { params: { id: string } }) {
  const truck = await getTruckById(params.id);
  
  if (!truck || !truck.is_visible) {
    notFound();
  }

  const [schedule, venues] = await Promise.all([
    getScheduleForTruck(params.id),
    getVenues()
  ]);

  const getVenueById = (id: string | null) => venues.find(v => v.id === id);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (t: string) => { 
    const [h, m] = t.split(':'); 
    const hr = parseInt(h); 
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; 
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-ridge-700 via-ridge-600 to-ridge-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/#trucks" className="inline-flex items-center gap-2 text-ridge-200 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all trucks
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-5xl">
              {icons[truck.cuisine_type || ''] || '🚚'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-4xl lg:text-5xl font-bold">{truck.name}</h1>
              </div>
              {truck.cuisine_type && (
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  {truck.cuisine_type}
                </span>
              )}
              {truck.description && (
                <p className="text-lg text-ridge-200 max-w-2xl">{truck.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content - Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-ridge-100 border-b border-ridge-200">
                <h2 className="font-display text-xl font-bold text-stone-900">Upcoming Schedule</h2>
              </div>
              
              {schedule.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-stone-500">No upcoming appearances scheduled.</p>
                  <p className="text-sm text-stone-400 mt-2">Check back soon or follow on social media for updates!</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {schedule.map(entry => {
                    const venue = getVenueById(entry.venue_id);
                    return (
                      <div key={entry.id} className="p-6 hover:bg-stone-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-display text-lg font-bold text-ridge-700">
                                {formatDate(entry.date)}
                              </span>
                              {entry.event_name && (
                                <span className="px-2 py-0.5 bg-sunset-100 text-sunset-700 rounded-full text-xs font-medium">
                                  🎉 {entry.event_name}
                                </span>
                              )}
                            </div>
                            <div className="text-stone-600">
                              📍 {venue?.name || entry.other_venue_name || 'TBA'}
                              {venue?.address && (
                                <span className="text-stone-400 text-sm ml-2">({venue.address})</span>
                              )}
                            </div>
                            <div className="text-stone-500 text-sm mt-1">
                              🕐 {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </div>
                          </div>
                          {venue?.lat && venue?.lng && (
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-ridge-600 hover:bg-ridge-700 text-white text-sm font-medium rounded-lg transition-colors text-center shrink-0"
                            >
                              Get Directions
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Contact & Social */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-ridge-100 border-b border-ridge-200">
                <h2 className="font-display text-lg font-bold text-stone-900">Connect</h2>
              </div>
              <div className="p-6 space-y-4">
                {truck.phone && (
                  <a 
                    href={`tel:${truck.phone}`}
                    className="flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-ridge-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-ridge-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-stone-500">Phone</div>
                      <div className="font-medium text-stone-900">{truck.phone}</div>
                    </div>
                  </a>
                )}
                
                {truck.facebook && (
                  <a 
                    href={truck.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-stone-50 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-stone-500">Facebook</div>
                      <div className="font-medium text-stone-900">Follow us</div>
                    </div>
                  </a>
                )}
                
                {truck.instagram && (
                  <a 
                    href={truck.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-stone-50 hover:bg-pink-50 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-stone-500">Instagram</div>
                      <div className="font-medium text-stone-900">Follow us</div>
                    </div>
                  </a>
                )}

                {!truck.phone && !truck.facebook && !truck.instagram && (
                  <p className="text-stone-500 text-sm text-center py-4">No contact info available yet.</p>
                )}
              </div>
            </div>

            {/* Future: Menu, Photos, etc. will go here */}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
