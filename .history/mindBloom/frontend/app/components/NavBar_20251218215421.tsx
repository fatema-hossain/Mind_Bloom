"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
// import SakuraLogo from "./SakuraLogo"; // Uncomment if you have this component

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface UserInfo {
  user_id: number;
  username: string;
  email?: string;
  role?: string;
  loggedIn: boolean;
}

interface AdminInfo {
  username: string;
  password?: string;
  is_dev: boolean;
}

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();
  
  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{type: "success" | "error", text: string} | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Admin dropdown state
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";
  
  // Fetch admin info when admin clicks their username
  const fetchAdminInfo = async () => {
    if (!user || !isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin-info/${user.username}`);
      const data = await response.json();
      if (response.ok) {
        setAdminInfo(data);
      }
    } catch {
      console.error("Failed to fetch admin info");
    }
  };
  
  const handleAdminClick = () => {
    if (isAdmin) {
      if (!showAdminDropdown) {
        fetchAdminInfo();
      }
      setShowAdminDropdown(!showAdminDropdown);
    }
  };

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    
    if (!user) return;
    
    setChangingPassword(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({ type: "error", text: data.detail || "Failed to change password" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Connection error. Please try again." });
    } finally {
      setChangingPassword(false);
    }
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
                backgroundImage: 'linear-gradient(180deg,rgb(224, 200, 200) 0%, #eca8dbff 50%, #f4eaeaff 100%)',
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
              <div className="flex items-center gap-2 ml-2 relative">
                {/* Username Button - Green for Admin */}
                <button
                  onClick={handleAdminClick}
                  className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 ${
                    isAdmin 
                      ? "bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-400 text-emerald-700 hover:shadow-md cursor-pointer" 
                      : "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800"
                  }`}
                  title={isAdmin ? "Click to view admin info" : undefined}
                >
                  <span>{isAdmin ? "👑" : "👤"}</span>
                  {user.username}
                  {isAdmin && (
                    <svg className={`w-3 h-3 transition-transform ${showAdminDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                
                {/* Admin Dropdown */}
                {isAdmin && showAdminDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-100">
                      <span className="text-2xl">👑</span>
                      <div>
                        <p className="font-bold text-emerald-800">Admin Account</p>
                        <p className="text-xs text-emerald-600">Role: Administrator</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Username:</span>
                        <span className="font-mono font-bold text-emerald-700">{adminInfo?.username || user.username}</span>
                      </div>
                      
                      {/* Password - Only show in dev environment */}
                      {adminInfo?.is_dev && adminInfo?.password && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Password:</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{adminInfo.password}</span>
                        </div>
                      )}
                      
                      {adminInfo && !adminInfo.is_dev && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                          🔒 Password hidden in production
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-emerald-100">
                      <p className="text-xs text-slate-500">
                        {adminInfo?.is_dev ? "🛠️ Development Mode" : "🔐 Production Mode"}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Settings Button */}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="p-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  title="Change Password"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
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
                        setShowPasswordModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl font-bold text-base transition-all duration-200 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-center flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </button>
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordMessage(null);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-purple-200 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-300">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordMessage(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Message */}
                {passwordMessage && (
                  <div className={`p-2.5 rounded-xl text-sm font-medium ${
                    passwordMessage.type === "success" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordMessage(null);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}