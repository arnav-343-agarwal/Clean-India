'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <nav className="bg-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl">SwachhMap</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-green-700 text-white' 
                  : 'text-green-100 hover:bg-green-700 hover:text-white'
              }`}
            >
              Home
            </Link>
            
            <Link 
              href="/report" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/report') 
                  ? 'bg-green-700 text-white' 
                  : 'text-green-100 hover:bg-green-700 hover:text-white'
              }`}
            >
              Report an Issue
            </Link>
            
            <Link 
              href="/explore" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/explore') 
                  ? 'bg-green-700 text-white' 
                  : 'text-green-100 hover:bg-green-700 hover:text-white'
              }`}
            >
              Explore Reports
            </Link>

            {/* Login placeholder - can be added later */}
            <button className="px-4 py-2 bg-white text-green-600 rounded-md text-sm font-medium hover:bg-green-50 transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 