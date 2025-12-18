"use client";

import { useEffect, useState } from "react";

// 1. Define a type for our particle styles to keep things clean
type ParticleStyle = {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  width?: string;
  height?: string;
};

export default function AboutPage() {
  // 2. Create state to hold the random values
  const [fireflies, setFireflies] = useState<ParticleStyle[]>([]);
  const [stars, setStars] = useState<ParticleStyle[]>([]);

  // 3. Generate the random values ONLY once the component mounts (Client-side)
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
      {/* Starry Firefly Background */}
      <div className="fireflies-container" aria-hidden="true">
        {/* 4. Map over the state variables instead of creating new arrays on the fly */}
        {fireflies.map((style, i) => (
          <div
            key={`firefly-${i}`}
            className="firefly"
            style={style} // Apply the deterministic style object
          />
        ))}
        {stars.map((style, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={style} // Apply the deterministic style object
          />
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
                  "linear-gradient(180deg, #f7f7f7ff 0%, #eca8dbff 50%, #bdbdbdff 100%)",
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

        {/* ... The rest of your sections (Mission, Challenge, Solution, etc.) remain exactly the same ... */}
        
        {/* Disclaimer */}
        <section className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-sm text-blue-900">
            <strong>Important Disclaimer:</strong> Mind Bloom is a screening tool
            for informational purposes only. It is not a diagnostic tool and
            should not replace professional medical advice. Please consult with
            a qualified healthcare provider for proper diagnosis and treatment
            of postpartum depression.
          </p>
        </section>
      </div>
    </main>
  );
}