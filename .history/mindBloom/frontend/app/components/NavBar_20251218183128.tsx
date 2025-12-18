"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
// import SakuraLogo from "./SakuraLogo"; // Uncomment if you have this component

interface UserInfo {
  user_id: number;
  username: string;
  email?: string;
  loggedIn: boolean;
}

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();

  // Check for logged in user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("mindbloom_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.loggedIn) {
          setUser(userData);
        }
      } catch {
        // Invalid stored data
        localStorage.removeItem("mindbloom_user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mindbloom_user");
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/assessment", label: "Assessment" },
    { href: "/report", label: "Report" },
    { href: "/about", label: "About" },
    { href: "/admin", label: "Admin" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    // VISIBILITY UPDATE: Added a white/90 base with the gradient on top for better contrast against page content
    <nav className="sticky top-0 z-50 bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur-xl border-b-2 border-purple-100 shadow-lg">
      
      {/* Subtle Gradient Overlay to harmonize with the page theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section - RESTORED BRAND STYLE */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 border border-purple-200">
              <span className="text-2xl filter drop-shadow-sm">🌸</span>
            </div>
            
            {/* The specific League Spartan Gradient Text you liked */}
            <span 
              className="text-2xl font-black tracking-wide hidden sm:inline"
              style={{ 
                fontFamily: '"sans-serif", sans-serif',
                letterSpacing: '0.05em',
                backgroundImage: 'linear-gradient(180deg,rgb(250, 225, 225) 0%, #eca8dbff 50%, #f4eaeaff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight : 'bold',
                borderRadius: '.9rem',
                //border: '2px solid rgba(255, 122, 184, 0.3)',
                padding: '0.01rem 0.9rem',
                WebkitTextStroke: '1px rgba(205, 25, 25, 0.1)',
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.4))',
                WebkitFilter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))'
              }}
            >
              MIND BLOOM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3 items-center">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 border-2 ${
                    active
                      /* HARMONIZATION: Active state now matches the Sidebar "Section Page" style */
                      ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-purple-300 text-purple-900 shadow-md scale-105"
                      : "border-transparent text-slate-600 hover:text-purple-800 hover:bg-white/50 hover:border-purple-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Login/User Section */}
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 font-bold text-sm flex items-center gap-2">
                  <span>👤</span>
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 border-2 ml-2 ${
                  isActive("/login")
                    ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-purple-300 text-purple-900 shadow-md scale-105"
                    : "border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"
                }`}
                style={{
                  backgroundImage: isActive("/login") ? undefined : 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-purple-800 hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-purple-100">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl font-bold text-base transition-all duration-200 border-2 ${
                      active
                        ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-purple-300 text-purple-900 shadow-sm"
                        : "border-transparent text-slate-600 hover:bg-purple-50 hover:text-purple-800 hover:pl-6"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              {/* Mobile Login/User Section */}
              <div className="mt-2 pt-2 border-t border-purple-100">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 font-bold text-base flex items-center gap-2">
                      <span>👤</span>
                      {user.username}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl font-bold text-base transition-all duration-200 border-2 border-red-200 text-red-600 hover:bg-red-50 text-center"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl font-bold text-base transition-all duration-200 border-2 border-purple-300 text-purple-700 text-center"
                    style={{
                      backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                    }}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}