"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);

  useEffect(() => {
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

  return (
    <main className="min-h-screen text-slate-800 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }} role="main">
      <div className="fireflies-container" aria-hidden="true">
        {fireflies.map((f) => (
          <div key={`firefly-${f.id}`} className="firefly" style={{ left: f.left, top: f.top, animationDelay: f.delay, animationDuration: f.duration, width: f.size, height: f.size }} />
        ))}
        {stars.map((s) => (
          <div key={`star-${s.id}`} className="star" style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.duration }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto w-full">
            <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center drop-shadow-lg text-6xl">
                  🌸
                </div>
                <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black mb-6 px-2" style={{ fontFamily: '\"League Spartan\", sans-serif', letterSpacing: '0.08em', backgroundImage: 'linear-gradient(180deg, #d896e8 0%, #ff69d9 50%, #4d0048 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))', WebkitFilter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))' }}>MIND BLOOM</h1>
              </div>
              <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                <p className="text-xl sm:text-2xl text-slate-700 font-semibold mb-4">Empowering Bangladeshi Mothers with AI-Powered Mental Health Screening</p>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">A culturally sensitive, accessible platform for early detection of postpartum depression using advanced machine learning</p>
              </div>
              <div className="mb-10 text-center animate-in fade-in zoom-in-50 duration-700 delay-200">
                <Link href="/assessment">
                  <button className="group inline-flex items-center gap-3 px-10 py-5 text-slate-800 font-bold text-lg rounded-3xl hover:shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 border-2 border-purple-300 shadow-lg" style={{
                    backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
                  }}>Start Assessment<span className="group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true"></span></button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[{ label: "AI-Powered", desc: "Advanced ML model" }, { label: "Culturally Sensitive", desc: "Bangladesh-focused" }, { label: "Private & Secure", desc: "Your data protected" }].map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 bg-gradient-to-br from-blue-100/80 via-purple-100/70 to-pink-100/80 rounded-2xl border-2 border-purple-200/60 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                    <div className="font-bold text-slate-800 text-lg mb-1">{item.label}</div>
                    <div className="text-sm text-slate-600">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-blue-50/80 backdrop-blur-2xl border border-pink-200/60 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-200 flex items-center justify-center border-2 border-pink-300"><svg className="w-6 h-6 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">About Postpartum Depression</h2>
              </div>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">Postpartum depression (PPD) affects millions of mothers worldwide, but it's often undiagnosed. Mind Bloom provides an accessible, confidential screening tool tailored to Bangladeshi mothers.</p>
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-blue-200/60 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-200 flex items-center justify-center border-2 border-blue-300"><svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Why This Matters</h2>
              </div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3"><span className="font-bold text-purple-600"></span><span>Early detection prevents complications</span></li>
                <li className="flex items-start gap-3"><span className="font-bold text-purple-600"></span><span>AI provides personalized risk assessment</span></li>
                <li className="flex items-start gap-3"><span className="font-bold text-purple-600"></span><span>Confidential and culturally appropriate</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6">Ready to take the assessment?</p>
            <Link href="/assessment">
              <button className="group px-10 py-5 text-slate-800 font-bold text-lg rounded-3xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-purple-300 shadow-lg" style={{
                backgroundImage: 'linear-gradient(180deg, #fce7f3 0%, #e9d5ff 50%, #bfdbfe 100%)',
              }}>Begin Assessment </button>
            </Link>
            <p className="mt-6 text-sm text-slate-600">5-7 minutes. Your privacy is our priority.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
