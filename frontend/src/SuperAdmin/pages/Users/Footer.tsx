import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-br from-[#0d2544] to-[#1B4F8A] text-white rounded-3xl mt-8 overflow-hidden shadow-xl">
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight">Swift<span className="text-[#F59E0B]">Ride</span></span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Your Ride. Your Time. Your Journey. Creating extraordinary travel experiences with professional SaaS mobility solutions.
            </p>
          </div>

          {/* Support Contacts */}
          <div className="space-y-4">
            <h4 className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest">SUPPORT</h4>
            <div className="space-y-2 text-sm text-white/80">
              <p className="flex items-center gap-2">
                <span>📞</span>
                <span>+1 800-SWIFTRIDE</span>
              </p>
              <p className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:support@swiftride.app" className="hover:underline hover:text-[#F59E0B]">
                  support@swiftride.app
                </a>
              </p>
              <p className="text-white/60 text-xs">Mon–Sat, 8 AM – 8 PM</p>
            </div>
          </div>

          {/* App Links & Documents */}
          <div className="space-y-4">
            <h4 className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest font-sans">LINKS</h4>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <Link to="/TermsAndConditions" className="hover:text-[#F59E0B] transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/PrivacyPolicy" className="hover:text-[#F59E0B] transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-6"></div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>© {currentYear} SwiftRide Transport Platform. All Rights Reserved.</span>
          <span>Powered by SwiftRide SaaS</span>
        </div>
      </div>
    </footer>
  );
}
