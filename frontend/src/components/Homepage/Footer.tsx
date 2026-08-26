import React from 'react';
import { Link } from 'react-router-dom';

const PLATFORM_NAME = 'SwiftRide';
const SUPPORT_EMAIL = 'support@swiftride.app';
const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-[#0d2544] to-[#1B4F8A] text-white">
      {/* Top section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <span className="text-2xl font-extrabold">Swift<span className="text-[#F59E0B]">Ride</span></span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Fast, professional and reliable transport booking for individuals, corporates, schools and organisations.
            </p>
            <p className="text-white/50 text-xs">
              Your Ride. Your Time. Your Journey.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Quick Links</p>
            <div className="space-y-2">
              {[
                { label: 'Book a Cab', href: '/customer/book' },
                { label: 'Track Booking', href: '/track-booking' },
                { label: 'Login', href: '/login' },
                { label: 'Register', href: '/register' },
                { label: 'Terms & Conditions', href: '/TermsAndConditions' },
                { label: 'Privacy Policy', href: '/PrivacyPolicy' },
              ].map((link) => (
                <div key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-[#F59E0B] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">Support</p>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-white/70 hover:text-[#F59E0B] text-sm transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white/70 text-sm">Mon–Sat, 8 AM – 8 PM</span>
              </div>
            </div>

            {/* Social (neutral — no personal links) */}
            <div className="flex gap-3 pt-2">
              {[
                { href: 'https://www.facebook.com/', label: 'Facebook', icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /> },
                { href: 'https://www.instagram.com/', label: 'Instagram', icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></> },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>© {YEAR} {PLATFORM_NAME} Transport Platform. All Rights Reserved.</span>
          <span>Powered by SwiftRide SaaS</span>
        </div>
      </div>
    </footer>
  );
}
