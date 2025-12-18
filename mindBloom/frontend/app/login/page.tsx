"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Backend base URL (env-driven with local fallback)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  
  // Generate firefly positions only on client-side to avoid hydration mismatch
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);
  const [isClient, setIsClient] = useState(false);

  // Generate fireflies and stars only on client after hydration
  useEffect(() => {
    setIsClient(true);
    setFireflies(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 4}s`,
      size: `${3 + Math.random() * 3}px`,
    })));

    setStars(Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
    })));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validation
    if (!username || !password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin 
        ? { username, password }
        : { username, password, email: email || null };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info in localStorage
        localStorage.setItem("mindbloom_user", JSON.stringify({
          user_id: data.user_id,
          username: data.username,
          email: data.email,
          loggedIn: true
        }));
        
        setSuccess(data.message || (isLogin ? "Login successful!" : "Account created successfully!"));
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError(data.detail || "An error occurred");
      }
    } catch {
      setError("Failed to connect to server. Please try again.");
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center text-slate-800 p-4 sm:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }} role="main">
      {/* Starry Firefly Background */}
      {isClient && (
        <div className="fireflies-container" aria-hidden="true">
          {fireflies.map((f) => (
            <div
              key={`firefly-${f.id}`}
              className="firefly"
              style={{
                left: f.left,
                top: f.top,
                animationDelay: f.delay,
                animationDuration: f.duration,
                width: f.size,
                height: f.size,
              }}
            />
          ))}
          {stars.map((s) => (
            <div
              key={`star-${s.id}`}
              className="star"
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.delay,
                animationDuration: s.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-5xl animate-in zoom-in-50 duration-700 hover:scale-110 transition-all">
            🌸
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ 
              fontFamily: '"sans-serif", sans-serif',
              letterSpacing: '0.05em',
              backgroundImage: 'linear-gradient(180deg, #f7f7f7ff 0%, #eca8dbff 50%, #bdbdbdff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight : 'bold',
              WebkitTextStroke: '1px rgba(205, 25, 25, 0.1)',
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.4))',
              WebkitFilter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))'
            }}>
            MIND BLOOM
          </h1>
          <p className="text-slate-600 font-semibold">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-white/50 rounded-2xl p-1 border border-purple-200">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
              isLogin
                ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 text-purple-900 shadow-md"
                : "text-slate-600 hover:text-purple-800"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
              !isLogin
                ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 text-purple-900 shadow-md"
                : "text-slate-600 hover:text-purple-800"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl animate-in fade-in shake duration-300">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-2xl animate-in fade-in zoom-in-50 duration-300">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
            <label htmlFor="username" className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Username
              {username && <span className="text-green-500 font-bold">✓</span>}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full min-h-[44px] px-4 py-3 text-base border-2 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 ${
                username ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80"
              }`}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Email Field (Sign Up Only) */}
          {!isLogin && (
            <div className="group animate-in fade-in slide-in-from-left-2 duration-500">
              <label htmlFor="email" className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email (Optional)
                {email && <span className="text-green-500 font-bold">✓</span>}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full min-h-[44px] px-4 py-3 text-base border-2 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 ${
                  email ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80"
                }`}
                placeholder="Enter your email"
              />
            </div>
          )}

          {/* Password Field */}
          <div className="group animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
            <label htmlFor="password" className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
              {password && <span className="text-green-500 font-bold">✓</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full min-h-[44px] px-4 py-3 text-base border-2 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 ${
                password ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80"
              }`}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {!isLogin && (
            <div className="group animate-in fade-in slide-in-from-left-2 duration-500 delay-150">
              <label htmlFor="confirmPassword" className="block mb-2.5 text-sm font-semibold text-slate-800 tracking-wide uppercase text-xs transition-colors duration-300 group-focus-within:text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Confirm Password
                {confirmPassword && password === confirmPassword && <span className="text-green-500 font-bold">✓</span>}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full min-h-[44px] px-4 py-3 text-base border-2 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-200 transition-all duration-300 hover:border-slate-500 ${
                  confirmPassword && password === confirmPassword ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50" : "border-purple-300 bg-gradient-to-r from-blue-50/80 via-purple-50/70 to-pink-50/80"
                }`}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-6 py-4 rounded-2xl font-bold border-2 transition-all duration-200 hover:scale-105 active:scale-95 text-slate-800 border-purple-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              isLogin ? "Login →" : "Create Account →"
            )}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 font-bold text-purple-600 hover:text-purple-800 underline underline-offset-2 transition-colors duration-200"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>

        {/* Decorative Element */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-center text-xs text-slate-500">
            🔒 Your data is securely stored and protected
          </p>
        </div>
      </div>
    </main>
  );
}

