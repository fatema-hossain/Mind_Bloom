"use client";

import { useState, useEffect } from "react";

interface StatisticsData {
  data_collection_stats?: {
    total_predictions?: number;
    total_feedback?: number;
    risk_distribution?: { [key: string]: number };
    feedback_rate?: number | string;
  };
  predictions?: number;
  feedback?: number;
  feedback_rate?: string;
  message?: string;
}

interface ShapFeature {
  feature: string;
  shap_value: number;
  feature_value: number | string;
  abs_shap_value: number;
  impact: "increases_risk" | "decreases_risk" | "neutral";
}

interface ShapExplanation {
  top_features?: ShapFeature[];
  risk_factors?: {
    increasing_risk: string[];
    decreasing_risk: string[];
  };
  base_value?: number;
  total_features_analyzed?: number;
}

interface AggregateShapFeature {
  feature: string;
  frequency: number;
  avg_impact: number;
}

interface AggregateShapData {
  success?: boolean;
  predictions_analyzed?: number;
  aggregate_shap?: {
    increasing_risk: AggregateShapFeature[];
    decreasing_risk: AggregateShapFeature[];
  };
  message?: string;
}

// Type for background particles
type ParticleStyle = {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
  width?: string;
  height?: string;
};

export default function ReportPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestShapExplanation, setLatestShapExplanation] = useState<ShapExplanation | null>(null);
  const [aggregateShap, setAggregateShap] = useState<AggregateShapData | null>(null);
  const [shapLoading, setShapLoading] = useState(true);
  
  // State for hydration-safe background
  const [fireflies, setFireflies] = useState<ParticleStyle[]>([]);
  const [stars, setStars] = useState<ParticleStyle[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  // 1. Generate particles on client side only (Hydration Fix)
  useEffect(() => {
    const fireflyArray = Array.from({ length: 25 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      width: `${3 + Math.random() * 3}px`,
      height: `${3 + Math.random() * 3}px`,
    }));
    setFireflies(fireflyArray);

    const starArray = Array.from({ length: 35 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
    }));
    setStars(starArray);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchAggregateShap = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/aggregate-shap?limit=20`);
        const data = await response.json();
        setAggregateShap(data);
      } catch (error) {
        console.error("Failed to fetch aggregate SHAP:", error);
        setAggregateShap(null);
      } finally {
        setShapLoading(false);
      }
    };

    try {
      const storedShap = localStorage.getItem("latestShapExplanation");
      if (storedShap) {
        setLatestShapExplanation(JSON.parse(storedShap));
      }
    } catch (error) {
      console.error("Failed to load SHAP explanation from localStorage:", error);
    }

    fetchStats();
    fetchAggregateShap();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const getPredictionCount = () => {
    if (stats?.data_collection_stats?.total_predictions) {
      return stats.data_collection_stats.total_predictions;
    }
    return stats?.predictions || 0;
  };

  const getFeedbackCount = () => {
    if (stats?.data_collection_stats?.total_feedback) {
      return stats.data_collection_stats.total_feedback;
    }
    return stats?.feedback || 0;
  };

  const getFeedbackRate = () => {
    if (stats?.data_collection_stats?.feedback_rate) {
      return stats.data_collection_stats.feedback_rate;
    }
    return stats?.feedback_rate || "0%";
  };

  const riskDistribution = stats?.data_collection_stats?.risk_distribution || {
    high: 0,
    medium: 0,
    low: 0,
  };

  const totalRisks = Object.values(riskDistribution).reduce((a, b) => a + b, 0) || 1;
  const highPercent = Math.round(((riskDistribution.high || 0) / totalRisks) * 100);
  const mediumPercent = Math.round(((riskDistribution.medium || 0) / totalRisks) * 100);
  const lowPercent = Math.round(((riskDistribution.low || 0) / totalRisks) * 100);

  return (
    <main className="min-h-screen text-slate-800 p-4 sm:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }} role="main">
      {/* Starry Firefly Background */}
      <div className="fireflies-container" aria-hidden="true">
        {fireflies.map((style, i) => (
          <div key={`firefly-${i}`} className="firefly" style={style} />
        ))}
        {stars.map((style, i) => (
          <div key={`star-${i}`} className="star" style={style} />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <section className="mb-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-5xl">
              🌸
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 px-2" style={{ 
                fontFamily: '"sans-serif", sans-serif',
                letterSpacing: '0.05em',
                backgroundImage: 'linear-gradient(180deg,rgb(200, 159, 159) 0%, #eca8dbff 50%,rgb(215, 184, 184) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight : 'bold',
                //borderRadius: '.9rem',
                //border: '2px solid rgba(255, 122, 184, 0.3)',
                //padding: '0.1rem 0.9rem',
                WebkitTextStroke: '1px rgba(205, 25, 25, 0.1)',
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.4))',
                WebkitFilter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))'
              }}>
              Reports & Insights (XAI)
            </h1>
            <p className="text-slate-700 text-sm sm:text-base">Real-time statistics and model performance metrics</p>
          </div>
        </section>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-purple-600"></div>
              <p className="mt-4 text-slate-700 font-semibold">Loading statistics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { 
                  icon: ( // Sparkle/Magic Icon for Prediction
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                  label: "Total Predictions", 
                  value: getPredictionCount(), 
                  color: "from-blue-500 to-blue-600" 
                },
                { 
                  icon: ( // Chat/Feedback Icon
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  ),
                  label: "Feedback Collected", 
                  value: getFeedbackCount(), 
                  color: "from-purple-500 to-purple-600" 
                },
                { 
                  icon: ( // Star/Rate Icon
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ),
                  label: "Feedback Rate", 
                  value: getFeedbackRate(), 
                  color: "from-pink-500 to-pink-600" 
                },
                { 
                  icon: ( // Target/Accuracy Icon
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                  label: "Model Accuracy", 
                  value: "~85-90%", 
                  color: "from-green-500 to-green-600" 
                },
              ].map((metric, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-3xl bg-gradient-to-br ${metric.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-2 duration-500`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-10 h-10 mb-3">
                    {metric.icon}
                  </div>
                  <p className="text-sm font-semibold opacity-90">{metric.label}</p>
                  <p className="text-3xl font-bold mt-2">{metric.value}</p>
                </div>
              ))}
            </section>

            {/* Risk Distribution */}
            <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-blue-50/90 backdrop-blur-2xl border border-pink-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-300">
                  {/* Pie Chart Icon */}
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Risk Level Distribution</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart-like visualization */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-slate-800">High Risk</label>
                      <span className="font-bold text-red-600">{highPercent}% ({riskDistribution.high || 0})</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                        style={{ width: `${highPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-slate-800">Medium Risk</label>
                      <span className="font-bold text-yellow-600">{mediumPercent}% ({riskDistribution.medium || 0})</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                        style={{ width: `${mediumPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-slate-800">Low Risk</label>
                      <span className="font-bold text-green-600">{lowPercent}% ({riskDistribution.low || 0})</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${lowPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="flex flex-col justify-center">
                  <div className="p-6 bg-white/70 rounded-2xl border-2 border-purple-200">
                    <p className="text-sm font-semibold text-slate-600 mb-4">RISK ASSESSMENT SUMMARY</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-slate-700">
                          <strong>{highPercent}%</strong> require immediate professional consultation
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-700">
                          <strong>{mediumPercent}%</strong> need continued monitoring and support
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-slate-700">
                          <strong>{lowPercent}%</strong> showing positive mental health indicators
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Model Information */}
            <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
              <div className="flex items-start gap-4 mb-6">
                {/* Microchip Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">AI Model Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Gears Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="font-bold text-blue-700">Model Type</p>
                      </div>
                      <p className="text-sm text-slate-700">Ensemble Voting Classifier</p>
                      <p className="text-xs text-slate-500 mt-2">Random Forest + Gradient Boosting + SVM</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Database Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        <p className="font-bold text-blue-700">Training Data</p>
                      </div>
                      <p className="text-sm text-slate-700">Clinical Dataset</p>
                      <p className="text-xs text-slate-500 mt-2">Bangladesh population-specific</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Check Circle Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-blue-700">Validation</p>
                      </div>
                      <p className="text-sm text-slate-700">Cross-validation</p>
                      <p className="text-xs text-slate-500 mt-2">85-90% accuracy on test set</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* List/Input Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <p className="font-bold text-blue-700">Input Features</p>
                      </div>
                      <p className="text-sm text-slate-700">53 Clinical Features</p>
                      <p className="text-xs text-slate-500 mt-2">Auto-derived from ~27 questions</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Node/Branch Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <p className="font-bold text-blue-700">Output Classes</p>
                      </div>
                      <p className="text-sm text-slate-700">Low / Medium / High</p>
                      <p className="text-xs text-slate-500 mt-2">PPD Risk Probability</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Refresh Icon */}
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="font-bold text-blue-700">Updates</p>
                      </div>
                      <p className="text-sm text-slate-700">Weekly Retraining</p>
                      <p className="text-xs text-slate-500 mt-2">Improved with new data</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SHAP Feature Importance */}
            {latestShapExplanation && latestShapExplanation.top_features && (
              <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-violet-50/90 backdrop-blur-2xl border border-indigo-200/60 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-300">
                    {/* Bar Chart Icon */}
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">SHAP Feature Importance</h2>
                </div>

                <p className="text-slate-700 mb-6 text-sm">
                  Understanding which factors most influenced the latest assessment result. SHAP values show how each factor pushed the prediction towards higher or lower risk.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  {/* Top Features Contributing to Risk */}
                  <div className="p-6 bg-white/70 rounded-2xl border-2 border-indigo-200 shadow-lg">
                    <h3 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                      {/* Trend Up Icon */}
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Risk Increasing Factors
                    </h3>
                    <div className="space-y-3">
                      {latestShapExplanation.top_features
                        .filter(f => f.impact === "increases_risk")
                        .slice(0, 5)
                        .map((feature, idx) => (
                          <div key={`risk-increasing-${idx}`} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-red-900 text-sm">{feature.feature.replace(/_/g, " ").toUpperCase()}</p>
                              <span className="text-xs font-bold text-red-600">{Math.abs(feature.shap_value).toFixed(3)}</span>
                            </div>
                            <p className="text-xs text-red-700">
                              Current value: <span className="font-semibold">{typeof feature.feature_value === "number" ? feature.feature_value.toFixed(2) : feature.feature_value}</span>
                            </p>
                            <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-gradient-to-r from-red-400 to-red-600"
                                style={{ width: `${Math.min(Math.abs(feature.shap_value) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top Features Protecting from Risk */}
                  <div className="p-6 bg-white/70 rounded-2xl border-2 border-green-200 shadow-lg">
                    <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                      {/* Shield Check Icon */}
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Protective Factors
                    </h3>
                    <div className="space-y-3">
                      {latestShapExplanation.top_features
                        .filter(f => f.impact === "decreases_risk")
                        .slice(0, 5)
                        .map((feature, idx) => (
                          <div key={`risk-decreasing-${idx}`} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-green-900 text-sm">{feature.feature.replace(/_/g, " ").toUpperCase()}</p>
                              <span className="text-xs font-bold text-green-600">{Math.abs(feature.shap_value).toFixed(3)}</span>
                            </div>
                            <p className="text-xs text-green-700">
                              Current value: <span className="font-semibold">{typeof feature.feature_value === "number" ? feature.feature_value.toFixed(2) : feature.feature_value}</span>
                            </p>
                            <div className="w-full h-1.5 bg-green-200 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                style={{ width: `${Math.min(Math.abs(feature.shap_value) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Risk Factors Summary */}
                {latestShapExplanation.risk_factors && (
                  <div className="p-6 bg-white/80 rounded-2xl border-2 border-purple-300">
                    <h3 className="font-bold text-purple-800 mb-4">📊 Assessment Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {latestShapExplanation.risk_factors.increasing_risk.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Contributing to Higher Risk:</p>
                          <ul className="space-y-1">
                            {latestShapExplanation.risk_factors.increasing_risk.slice(0, 5).map((factor, idx) => (
                              <li key={`summary-increasing-${idx}`} className="text-sm text-red-700 flex items-center gap-2">
                                <span className="text-red-500">▸</span> {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {latestShapExplanation.risk_factors.decreasing_risk.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Contributing to Lower Risk:</p>
                          <ul className="space-y-1">
                            {latestShapExplanation.risk_factors.decreasing_risk.slice(0, 5).map((factor, idx) => (
                              <li key={`summary-decreasing-${idx}`} className="text-sm text-green-700 flex items-center gap-2">
                                <span className="text-green-500">▸</span> {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-300 rounded-lg flex gap-3">
                  <svg className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-indigo-700">
                    <span className="font-semibold">How to read:</span> SHAP values show how much each factor influences the model's decision. Higher absolute values indicate stronger influence. Red factors push toward higher risk, green factors push toward lower risk.
                  </p>
                </div>
              </section>
            )}

            {/* Online Learning */}
            <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 border border-green-300">
                  {/* Infinity/Loop Icon */}
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Continuous Learning</h2>
                  <p className="text-slate-700 mb-6">
                    Mind Bloom improves over time through online learning and user feedback. Every prediction and 
                    user feedback helps refine our model to better serve Bangladeshi mothers.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Edit/Pen Icon */}
                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p className="font-bold text-purple-700">User Feedback</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        Your feedback on assessment accuracy helps us improve predictions
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Sync Icon */}
                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="font-bold text-purple-700">Model Retraining</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        Weekly model updates incorporate new data for better performance
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Trending Up Icon */}
                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p className="font-bold text-purple-700">Version Tracking</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        All model versions are tracked for transparency and audit trail
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Shield Lock Icon */}
                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="font-bold text-purple-700">Privacy First</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        All data collection and learning happens while protecting user privacy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Status */}
            <section className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <div className="flex items-start gap-3">
                {/* Pulse Icon */}
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-800">System Status</p>
                  <p className="text-sm text-slate-700 mt-1">
                    {stats?.message || "Online learning system is active. Data collection and model retraining are enabled."}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}