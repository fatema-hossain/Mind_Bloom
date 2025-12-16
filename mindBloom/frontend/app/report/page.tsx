"use client";

import { useState, useEffect } from "react";

interface StatisticsData {
  data_collection_stats?: {
    total_predictions?: number;
    total_feedback?: number;
    risk_distribution?: { [key: string]: number };
    feedback_rate?: string;
  };
  predictions?: number;
  feedback?: number;
  feedback_rate?: string;
  message?: string;
}

export default function ReportPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

    fetchStats();
    // Refresh stats every 30 seconds
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
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={`firefly-${i}`}
            className="firefly"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
              width: `${3 + Math.random() * 3}px`,
              height: `${3 + Math.random() * 3}px`,
            }}
          />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
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
                backgroundImage: 'linear-gradient(180deg, #f7f7f7ff 0%, #eca8dbff 50%, #f4eaeaff 100%)',
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
              Reports & Insights
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
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                  label: "Total Predictions",
                  value: getPredictionCount(),
                  color: "from-blue-500 to-blue-600",
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01M12 8V4m0 16v-4" />
                    </svg>
                  ),
                  label: "Feedback Collected",
                  value: getFeedbackCount(),
                  color: "from-purple-500 to-purple-600",
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  label: "Feedback Rate",
                  value: getFeedbackRate(),
                  color: "from-pink-500 to-pink-600",
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                  ),
                  label: "Model Accuracy",
                  value: "~85-90%",
                  color: "from-green-500 to-green-600",
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
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
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
                <span className="text-4xl">🤖</span>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">AI Model Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <p className="font-bold text-blue-700 mb-2">🔧 Model Type</p>
                      <p className="text-sm text-slate-700">Ensemble Voting Classifier</p>
                      <p className="text-xs text-slate-500 mt-2">Random Forest + Gradient Boosting + SVM</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747 0-6.002-4.5-10.747-10-10.747z" />
                        </svg>
                        <p className="font-bold text-blue-700">Training Data</p>
                      </div>
                      <p className="text-sm text-slate-700">Clinical Dataset</p>
                      <p className="text-xs text-slate-500 mt-2">Bangladesh population-specific</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="font-bold text-blue-700">Validation</p>
                      </div>
                      <p className="text-sm text-slate-700">Cross-validation</p>
                      <p className="text-xs text-slate-500 mt-2">85-90% accuracy on test set</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-bold text-blue-700">Input Features</p>
                      </div>
                      <p className="text-sm text-slate-700">53 Clinical Features</p>
                      <p className="text-xs text-slate-500 mt-2">Auto-derived from 20 questions</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
                        </svg>
                        <p className="font-bold text-blue-700">Output Classes</p>
                      </div>
                      <p className="text-sm text-slate-700">Low / Medium / High</p>
                      <p className="text-xs text-slate-500 mt-2">PPD Risk Probability</p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
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

            {/* Online Learning */}
            <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 border border-green-300">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6c2.206 0 3 1.116 3 2.5 0 2.766-1 5.5-1 5.5s.5 1.5-1.5 3.5c-2 2-1.333 3-3.5 3-2.167 0-2-1-3.5-3 0 0-1-2.734-1-5.5C3 7.116 3.794 6 6 6m0 0l3-2m0 0l3 2" />
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
                      <p className="font-bold text-purple-700 mb-2">📝 User Feedback</p>
                      <p className="text-sm text-slate-700">
                        Your feedback on assessment accuracy helps us improve predictions
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <p className="font-bold text-purple-700 mb-2">🔄 Model Retraining</p>
                      <p className="text-sm text-slate-700">
                        Weekly model updates incorporate new data for better performance
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <p className="font-bold text-purple-700 mb-2">📈 Version Tracking</p>
                      <p className="text-sm text-slate-700">
                        All model versions are tracked for transparency and audit trail
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                      <p className="font-bold text-purple-700 mb-2">🛡️ Privacy First</p>
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
                <span className="text-2xl">ℹ️</span>
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
