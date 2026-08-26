import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SimpleHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100">
      {/* Top contact bar */}
      <div className="w-full bg-[#1B4F8A] text-white text-xs py-1.5 px-4 hidden sm:block">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5 opacity-80">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href="mailto:support@swiftride.app" className="hover:text-[#F59E0B] transition-colors">
              support@swiftride.app
            </a>
          </div>
          <span className="opacity-60">Professional Transport Platform</span>
        </div>
      </div>

      {/* Logo + Nav */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1B4F8A] flex items-center justify-center shadow">
            <svg className="w-4.5 h-4.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <span className="text-xl font-extrabold text-[#1B4F8A] tracking-tight">
            Swift<span className="text-[#F59E0B]">Ride</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-[#1B4F8A] hover:text-[#F59E0B] transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-bold px-4 py-2 bg-[#1B4F8A] text-white rounded-xl hover:bg-[#12376B] transition-all shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;