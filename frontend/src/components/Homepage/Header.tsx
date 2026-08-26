import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Brand constants
const SUPPORT_PHONE = '+1 800-SWIFTRIDE';
const SUPPORT_EMAIL = 'support@swiftride.app';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBookCab = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'customer') {
        navigate('/customer/book');
      } else if (['superadmin', 'admin', 'accountant', 'manager'].includes(role || '')) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* ── GLOBAL FONT ── */}
      <style>{`
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .sr-nav-link {
          font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9);
          transition: color 0.2s; cursor: pointer; padding: 4px 0;
          border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .sr-nav-link:hover { color: #F59E0B; border-bottom-color: #F59E0B; }
        .sr-nav-link-dark { color: #1B4F8A; }
        .sr-nav-link-dark:hover { color: #F59E0B; }
      `}</style>

      {/* ═══════════════════════════════════════════════
          TOP INFO BAR
      ═══════════════════════════════════════════════ */}
      <div className="w-full bg-[#12376B] text-white text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 opacity-80">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {SUPPORT_PHONE}
            </span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs opacity-70">
            <span>Individual · Fleet · Corporate · School</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          STICKY NAVBAR
      ═══════════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-[400] w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-lg border-b border-gray-100'
          : 'bg-[#1B4F8A]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Brand */}
          <button
            onClick={() => scrollTo('home')}
            className="flex items-center gap-2.5 shrink-0"
          >
            {/* SwiftRide logo mark */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${scrolled ? 'bg-[#1B4F8A]' : 'bg-white/20'}`}>
              <svg className={`w-5 h-5 ${scrolled ? 'text-white' : 'text-[#F59E0B]'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${scrolled ? 'text-[#1B4F8A]' : 'text-white'}`}>
              Swift<span className={scrolled ? 'text-[#F59E0B]' : 'text-[#F59E0B]'}>Ride</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <span className={`sr-nav-link ${scrolled ? 'sr-nav-link-dark' : ''}`} onClick={() => scrollTo('home')}>Home</span>
            <span className={`sr-nav-link ${scrolled ? 'sr-nav-link-dark' : ''}`} onClick={() => navigate('/track-booking')}>Track Booking</span>
            <span className={`sr-nav-link ${scrolled ? 'sr-nav-link-dark' : ''}`} onClick={() => scrollTo('about')}>About</span>
            <span className={`sr-nav-link ${scrolled ? 'sr-nav-link-dark' : ''}`} onClick={() => scrollTo('services')}>Services</span>
            <span className={`sr-nav-link ${scrolled ? 'sr-nav-link-dark' : ''}`} onClick={() => scrollTo('contact')}>Contact</span>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                scrolled
                  ? 'border-[#1B4F8A] text-[#1B4F8A] hover:bg-blue-50'
                  : 'border-white/40 text-white hover:bg-white/10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ${
                scrolled
                  ? 'bg-[#F59E0B] text-gray-900 hover:bg-[#D97706]'
                  : 'bg-[#F59E0B] text-gray-900 hover:bg-[#D97706]'
              }`}
            >
              Register
            </button>
            <button
              onClick={handleBookCab}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-[#1B4F8A] hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
            >
              Book a Cab
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className={`w-6 h-6 ${scrolled ? 'text-[#1B4F8A]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 space-y-1">
              {['home', 'about', 'services', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollTo(section)}
                  className="w-full text-left px-3 py-2.5 text-[#1B4F8A] font-semibold text-sm rounded-lg hover:bg-blue-50 capitalize"
                >
                  {section}
                </button>
              ))}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="py-2.5 text-center text-sm font-semibold border border-[#1B4F8A] text-[#1B4F8A] rounded-xl">
                  Login
                </button>
                <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                  className="py-2.5 text-center text-sm font-bold bg-[#F59E0B] text-gray-900 rounded-xl">
                  Register
                </button>
              </div>
              <button onClick={() => { handleBookCab(); setMobileMenuOpen(false); }}
                className="w-full mt-1 py-3 text-center text-sm font-bold bg-[#1B4F8A] text-white rounded-xl">
                Book a Cab
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-[88vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d2544 0%, #1B4F8A 45%, #1e6fbc 100%)' }}>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — Headline */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-xs font-semibold">
                <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
                Professional Transport Platform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Your Ride.<br />
                Your Time.<br />
                <span className="text-[#F59E0B]">Your Journey.</span>
              </h1>

              <p className="text-white/75 text-lg md:text-xl leading-relaxed max-w-lg">
                Simple, fast and reliable cab booking for individuals, corporates, schools and organisations.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleBookCab}
                  id="hero-book-cab-btn"
                  className="flex items-center gap-2 px-7 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                  </svg>
                  Book a Cab
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-2xl transition-all text-base backdrop-blur-sm"
                >
                  Login
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: '✓', text: 'Instant Booking' },
                  { icon: '✓', text: 'Real-time Tracking' },
                  { icon: '✓', text: 'Verified Drivers' },
                  { icon: '✓', text: 'Digital Invoice' },
                ].map((b) => (
                  <span key={b.text} className="flex items-center gap-1.5 text-white/70 text-sm">
                    <span className="text-[#F59E0B] font-bold">{b.icon}</span>
                    {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Showcase Card */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-white space-y-6">
                <h3 className="text-xl font-bold text-[#F59E0B]">Why Travel With Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] font-bold shrink-0 mt-0.5">✓</div>
                    <div>
                      <h4 className="font-semibold text-sm">Corporate Transport Roster</h4>
                      <p className="text-xs text-white/70 mt-0.5">Automated booking rosters and customized contracts for businesses.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] font-bold shrink-0 mt-0.5">✓</div>
                    <div>
                      <h4 className="font-semibold text-sm">Professional Fleet Support</h4>
                      <p className="text-xs text-white/70 mt-0.5">Toyota Innova Crysta, Suzuki Dzire and high-efficiency models.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] font-bold shrink-0 mt-0.5">✓</div>
                    <div>
                      <h4 className="font-semibold text-sm">Automatic Digital Invoices</h4>
                      <p className="text-xs text-white/70 mt-0.5">Receive structured trip summaries and tax invoices instantly on trip completion.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleBookCab}
                    className="w-full py-3 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-extrabold rounded-xl transition-all shadow-md text-sm"
                  >
                    Get Started Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-12 md:h-16" viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" fill="#F8FAFF"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section id="about" className="py-16 bg-[#F8FAFF]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-2">How SwiftRide Works</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">Book your ride in minutes — no complexity, no confusion.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '📍', title: 'Enter Route', desc: 'Enter pickup and drop locations with date and time.' },
              { step: '02', icon: '🚗', title: 'Choose Vehicle', desc: 'Compare vehicle types, seats and fare estimates instantly.' },
              { step: '03', icon: '✅', title: 'Confirm Booking', desc: 'Review and confirm your booking in one tap.' },
              { step: '04', icon: '🗺️', title: 'Track & Ride', desc: 'Track your driver live and receive real-time updates.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="absolute top-4 right-4 text-2xl font-extrabold text-gray-100">{item.step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SERVICES
      ═══════════════════════════════════════════════ */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-2">Transport for Every Need</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '👤',
                title: 'Individual Booking',
                desc: 'Book a cab instantly for yourself. One-way or round trips, any time.',
                color: 'from-blue-50 to-indigo-50',
                border: 'border-blue-100',
              },
              {
                icon: '🏢',
                title: 'Corporate & Organisations',
                desc: 'Monthly transport contracts for schools, colleges, hospitals and companies.',
                color: 'from-amber-50 to-yellow-50',
                border: 'border-amber-100',
              },
              {
                icon: '🚛',
                title: 'Fleet Management',
                desc: 'Operators manage vehicles, drivers, bookings and payments in one platform.',
                color: 'from-emerald-50 to-teal-50',
                border: 'border-emerald-100',
              },
            ].map((card) => (
              <div key={card.title} className={`rounded-2xl p-6 bg-gradient-to-br ${card.color} border ${card.border} hover:shadow-md transition-shadow`}>
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="font-extrabold text-gray-800 text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                <button
                  onClick={handleBookCab}
                  className="mt-4 text-[#1B4F8A] font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHY SWIFTRIDE
      ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-[#F8FAFF]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Why SwiftRide</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-2 mb-6">
                Built for Modern Transport Needs
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Real-time Tracking', desc: 'Track your driver on a live map from pick-up to destination.' },
                  { title: 'Digital Invoicing', desc: 'Automatic invoice generation with PDF download after every trip.' },
                  { title: 'Multiple Payment Options', desc: 'Pay by cash or online — flexible for every customer.' },
                  { title: 'Role-based Access', desc: 'Separate portals for customers, drivers, operators and organisations.' },
                  { title: 'Tenant Isolation', desc: 'Complete data isolation — your data never crosses operator boundaries.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-[#1B4F8A] flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#1B4F8A] to-[#0d2544] rounded-3xl p-8 text-white text-center shadow-2xl">
              <div className="text-5xl mb-4">🚖</div>
              <h3 className="text-2xl font-extrabold mb-3">Ready to Ride?</h3>
              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                Join thousands of customers who trust SwiftRide for reliable, professional transport every day.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-gray-900 font-extrabold rounded-xl transition-all shadow-lg text-sm"
              >
                Create Free Account
              </button>
              <button
                onClick={handleBookCab}
                className="w-full mt-3 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-sm"
              >
                Book a Cab Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONTACT SECTION
      ═══════════════════════════════════════════════ */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Get in Touch</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-2 mb-4">We're Here to Help</h2>
          <p className="text-gray-500 mb-8">Have questions about bookings, billing or fleet management? Our support team is ready.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
            <a
              href={`tel:${SUPPORT_PHONE.replace(/[^0-9+]/g, '')}`}
              className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-[#1B4F8A] hover:bg-blue-50 transition-all"
            >
              <svg className="w-5 h-5 text-[#1B4F8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div className="text-left">
                <p className="text-xs text-gray-400 font-semibold uppercase">Call Us</p>
                <p className="font-bold text-gray-800 text-sm">{SUPPORT_PHONE}</p>
              </div>
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-[#1B4F8A] hover:bg-blue-50 transition-all"
            >
              <svg className="w-5 h-5 text-[#1B4F8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <p className="text-xs text-gray-400 font-semibold uppercase">Email Us</p>
                <p className="font-bold text-gray-800 text-sm">{SUPPORT_EMAIL}</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Header;
