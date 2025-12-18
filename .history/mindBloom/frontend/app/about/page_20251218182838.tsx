"use client";

import { useEffect, useState } from "react";

// Define a type for the particle styles
type ParticleStyle = {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  width?: string;
  height?: string;
};

export default function AboutPage() {
  // State to hold the random styles for background effects
  const [fireflies, setFireflies] = useState<ParticleStyle[]>([]);
  const [stars, setStars] = useState<ParticleStyle[]>([]);

  // Generate random values ONLY on the client, after mount
  useEffect(() => {
    // Generate Fireflies
    const fireflyArray = Array.from({ length: 25 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      width: `${3 + Math.random() * 3}px`,
      height: `${3 + Math.random() * 3}px`,
    }));
    setFireflies(fireflyArray);

    // Generate Stars
    const starArray = Array.from({ length: 35 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
    }));
    setStars(starArray);
  }, []);

  return (
    <main
      className="min-h-screen text-slate-800 p-4 sm:p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)",
      }}
      role="main"
    >
      {/* Starry Firefly Background - Rendered from State */}
      <div className="fireflies-container" aria-hidden="true">
        {fireflies.map((style, i) => (
          <div key={`firefly-${i}`} className="firefly" style={style} />
        ))}
        {stars.map((style, i) => (
          <div key={`star-${i}`} className="star" style={style} />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Section */}
        <section className="mb-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-8xl">
              🌸
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black mb-4 px-2"
              style={{
                fontFamily: '"sans-serif", sans-serif',
                letterSpacing: "0.05em",
                backgroundImage:
                  "linear-gradient(180deg,rgb(200, 159, 159) , #eca8dbff 50%, #bdbdbdff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "bold",
                WebkitTextStroke: "1px rgba(205, 25, 25, 0.1)",
                filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.4))",
                WebkitFilter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.4))",
              }}
            >
              About Mind Bloom
            </h1>
            <p className="text-lg text-slate-700">
              Empowering Bangladeshi Mothers with AI-Powered Mental Health
              Assessment
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-blue-50/90 backdrop-blur-2xl border border-pink-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 border border-purple-300">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Our Mission
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Mind Bloom aims to democratize mental health screening for
                postpartum depression (PPD) in Bangladesh. We combine
                cutting-edge AI with culturally sensitive assessment to identify
                at-risk mothers early, enabling timely intervention and support.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Postpartum depression affects 10-20% of new mothers globally,
                yet many cases go undiagnosed due to lack of screening, cultural
                stigma, and limited access to mental health professionals.
              </p>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-300">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                The Challenge
              </h2>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-pink-500 font-bold mt-1">•</span>
                  <span>
                    <strong>Limited Screening:</strong> Only 30% of mothers in
                    Bangladesh receive PPD screening
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-500 font-bold mt-1">•</span>
                  <span>
                    <strong>Cultural Barriers:</strong> Mental health stigma
                    prevents open discussion about depression
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-500 font-bold mt-1">•</span>
                  <span>
                    <strong>Healthcare Access:</strong> Limited psychiatric
                    professionals in rural areas
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-500 font-bold mt-1">•</span>
                  <span>
                    <strong>Early Detection Gap:</strong> PPD often goes
                    undiagnosed until severe symptoms appear
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Our Solution */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0 border border-yellow-300">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Our Solution
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Mind Bloom uses an <strong>Ensemble Machine Learning Model</strong>{" "}
                combining Random Forest, Gradient Boosting, and Support Vector
                Machine classifiers to assess PPD risk with high accuracy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-bold text-purple-700">Evidence-Based</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    Built on PHQ-9 validated screening tool & clinical data
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="font-bold text-purple-700">Accessible</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    Simple online assessment, available 24/7
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <p className="font-bold text-purple-700">Private</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    Your data is secure and confidential
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
    {/* Globe Icon */}
    <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0016 5.5V3.935M19.347 16.57a16.66 16.66 0 01-3.347.43c-3.682 0-7.074-1.274-9.688-3.394M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
    {/* Bangladesh Map Icon */}
    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 3.5c-.5-1-2-1-2.5 0s-1 2-1.5 2.5c-1 1-2 0-2.5.5s-.5 2 0 3 1 2 1 3c0 .5-.5 1-1 1.5s-.5 1.5 0 2 1 1 2 1 2-1 2.5-1.5c.5-.5 1 0 1.5.5s1 1 1.5.5 1-2 .5-2.5c-.5-.5-1-1-.5-2s1-2 1-3-1-2-1.5-2.5z" />
      <circle cx="12" cy="12" r="2" className="text-red-500" fill="currentColor" />
    </svg>
    <p className="font-bold text-purple-700">Culturally Sensitive</p>
  </div>
                  <p className="text-sm text-slate-700">
                    Designed for Bangladeshi population
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 backdrop-blur-2xl border border-blue-300 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-300">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">
                      Quick Assessment
                    </h3>
                    <p className="text-slate-700">
                      Answer ~20 carefully selected questions covering
                      demographics, pregnancy history, mental health, and support
                      systems
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">
                      AI Analysis
                    </h3>
                    <p className="text-slate-700">
                      The ensemble model processes your responses and computes 53
                      clinical features automatically
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">
                      Risk Assessment
                    </h3>
                    <p className="text-slate-700">
                      Receive your personalized risk level (Low/Medium/High)
                      with confidence scores and recommendations
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">
                      Next Steps
                    </h3>
                    <p className="text-slate-700">
                      Get guidance on when to seek professional help and mental
                      health resources
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Statistics - UPDATED ICONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            {
              icon: (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ),
              label: "Model Accuracy",
              value: "~85-90%",
              desc: "Ensemble voting classifier",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              ),
              label: "PHQ-9 Questions",
              value: "9",
              desc: "Validated depression screening",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              label: "Assessment Time",
              value: "5-10 min",
              desc: "Quick & easy process",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              ),
              label: "Data Privacy",
              value: "100%",
              desc: "Secure & confidential",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-gradient-to-br from-white/80 via-purple-50/70 to-pink-50/80 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-2 border border-purple-200">
                {stat.icon}
              </div>
              <p className="font-bold text-slate-800 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </p>
              <p className="text-xs text-slate-600">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Support Resources - REVAMPED ICONS */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-yellow-50/90 backdrop-blur-2xl border border-amber-200/70 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-500">
          <div className="flex items-start gap-4">
            {/* Main Section Icon: Lifebuoy */}
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-300">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Get Support
              </h2>
              <p className="text-slate-700 mb-4">
                If you or someone you know is struggling with postpartum
                depression, please reach out:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Healthcare Provider */}
                <div className="p-4 bg-white/80 rounded-2xl border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-amber-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="font-bold text-amber-800">
                      Healthcare Provider
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Consult with your doctor or midwife
                  </p>
                </div>

                {/* Card 2: Mental Health Hotline - FIXED ICON */}
                <div className="p-4 bg-white/80 rounded-2xl border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-amber-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 00.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <p className="font-bold text-amber-800">
                      Mental Health Hotline
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Contact local mental health services
                  </p>
                </div>

                {/* Card 3: Support Groups */}
                <div className="p-4 bg-white/80 rounded-2xl border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-amber-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="font-bold text-amber-800">Support Groups</p>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Join community support networks
                  </p>
                </div>

                {/* Card 4: Educational Resources - FIXED ICON (Academic Cap) */}
                <div className="p-4 bg-white/80 rounded-2xl border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-amber-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                    <p className="font-bold text-amber-800">
                      Educational Resources
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Learn more about PPD and treatment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-sm text-blue-900">
            <strong>Important Disclaimer:</strong> Mind Bloom is a screening
            tool for informational purposes only. It is not a diagnostic tool
            and should not replace professional medical advice. Please consult
            with a qualified healthcare provider for proper diagnosis and
            treatment of postpartum depression.
          </p>
        </section>
      </div>
    </main>
  );
}