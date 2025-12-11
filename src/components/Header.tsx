'use client';

import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            <span className="font-display text-xl font-bold text-ridge-700">What&apos;s Rollin&apos; Local</span>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#today" className="text-stone-600 hover:text-ridge-600 font-medium transition-colors">Today</a>
            <a href="#schedule" className="text-stone-600 hover:text-ridge-600 font-medium transition-colors">Schedule</a>
            <a href="#trucks" className="text-stone-600 hover:text-ridge-600 font-medium transition-colors">Trucks</a>
            <a href="#venues" className="text-stone-600 hover:text-ridge-600 font-medium transition-colors">Venues</a>
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-stone-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-stone-100">
            <div className="flex flex-col gap-4">
              <a href="#today" className="text-stone-600 hover:text-ridge-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Today</a>
              <a href="#schedule" className="text-stone-600 hover:text-ridge-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Schedule</a>
              <a href="#trucks" className="text-stone-600 hover:text-ridge-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Trucks</a>
              <a href="#venues" className="text-stone-600 hover:text-ridge-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Venues</a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
