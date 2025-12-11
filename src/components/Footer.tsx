export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚚</span>
              <span className="font-display text-xl font-bold text-white">What&apos;s Rollin&apos; Local</span>
            </div>
            <p className="text-sm">Your guide to food trucks, breweries &amp; events in Western North Carolina.</p>
          </div>
          <div>
            <h3 className="font-display font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#today" className="hover:text-white transition-colors">Today&apos;s Trucks</a></li>
              <li><a href="#schedule" className="hover:text-white transition-colors">Weekly Schedule</a></li>
              <li><a href="#trucks" className="hover:text-white transition-colors">All Trucks</a></li>
              <li><a href="#venues" className="hover:text-white transition-colors">Venues</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold text-white mb-4">For Truck Owners</h3>
            <p className="text-sm mb-4">Want to get your truck listed?</p>
            <a href="mailto:hello@whatsrollinlocal.com" className="text-sunset-400 hover:text-sunset-300 text-sm font-medium">Contact Us →</a>
          </div>
        </div>
        <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} What&apos;s Rollin&apos; Local. Made with ❤️ in WNC.</p>
        </div>
      </div>
    </footer>
  );
}
