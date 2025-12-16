"use client";

import { useState, useRef } from "react";

interface DashboardStats {
  total_predictions?: number;
  risk_distribution?: { [key: string]: number };
  total_feedback?: number;
  feedback_rate?: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`);
      const data = await response.json();
      setStats(data.data_collection_stats || data);
    } catch (error) {
      setMessage("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload-csv`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Successfully uploaded ${file.name}. ${data.rows_added || 0} rows added to training data.`);
        fetchDashboardStats();
      } else {
        setMessage(`❌ Upload failed: ${data.detail || data.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage("❌ Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRetrain = async () => {
    if (!confirm("Are you sure you want to retrain the model? This may take a few minutes.")) {
      return;
    }

    setRetraining(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/retrain`, {
        method: "POST",
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Model retraining started. New version: ${data.model_version || "Latest"}`);
        fetchDashboardStats();
      } else {
        setMessage(`❌ Retrain failed: ${data.detail || data.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage("❌ Failed to start model retraining");
    } finally {
      setRetraining(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/predictions/export-csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mind-bloom-predictions-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        setMessage("✅ Data exported successfully");
      } else {
        setMessage("❌ Failed to export data");
      }
    } catch (error) {
      setMessage("❌ Export failed");
    }
  };

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
                backgroundImage: 'linear-gradient(180deg, #f7f7f7ff 0%, #eca8dbff 50%, #bdbdbdff 100%)',
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
              Admin Dashboard
            </h1>
            <p className="text-slate-700 text-sm sm:text-base">Manage model performance and training data</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Message Alert */}
        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-slate-800 font-semibold">{message}</p>
          </div>
        )}

        {/* Dashboard Stats */}
        {stats && (
          <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                label: "Total Predictions",
                value: stats.total_predictions || 0,
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                ),
                label: "High Risk",
                value: stats.risk_distribution?.high || 0,
                color: "from-red-500 to-red-600",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                label: "Medium Risk",
                value: stats.risk_distribution?.medium || 0,
                color: "from-yellow-500 to-yellow-600",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ),
                label: "Low Risk",
                value: stats.risk_distribution?.low || 0,
                color: "from-green-500 to-green-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-6 rounded-3xl bg-gradient-to-br ${stat.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-2 duration-500`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 mb-3">
                  {stat.icon}
                </div>
                <p className="text-sm font-semibold opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* CSV Upload Section */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-blue-50/90 backdrop-blur-2xl border border-pink-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">📁</span>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">CSV Data Upload</h2>
              <p className="text-slate-700">Add new training data to improve model performance</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-purple-300 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 relative"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">📤</span>
                <div>
                  <p className="font-bold text-slate-800">Drag & Drop or Click to Upload</p>
                  <p className="text-sm text-slate-600">CSV file with patient data</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {/* File Info */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
              <p className="text-sm text-slate-700">
                <strong>Expected Format:</strong> CSV file with columns matching the training data schema (Age, Education Level, Pregnancy History, PHQ-9 scores, etc.)
              </p>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Select CSV File"}
            </button>
          </div>
        </section>

        {/* Model Management Section */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Model Management</h2>
              <p className="text-slate-700">Retrain and deploy updated models</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Retrain Model */}
            <div className="p-6 bg-white/70 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Retrain Model</h3>
              </div>
              <p className="text-sm text-slate-700 mb-4">
                Retrain the ensemble model with all collected data to improve predictions.
              </p>
              <button
                onClick={handleRetrain}
                disabled={retraining}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {retraining ? "Retraining..." : "Start Retraining"}
              </button>
              <p className="text-xs text-slate-500 mt-3">⏱️ This may take 5-15 minutes</p>
            </div>

            {/* Export Data */}
            <div className="p-6 bg-white/70 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-300">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Export Data</h3>
              </div>
              <p className="text-sm text-slate-700 mb-4">
                Download all collected predictions and feedback as CSV for analysis.
              </p>
              <button
                onClick={handleExportData}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all duration-200"
              >
                Export as CSV
              </button>
              <p className="text-xs text-slate-500 mt-3">📁 Download for backup or analysis</p>
            </div>
          </div>

          {/* Model Info */}
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200">
            <p className="text-sm text-slate-800">
              <strong>Current Model:</strong> Ensemble Voting Classifier (Random Forest + Gradient Boosting + SVM)
            </p>
            <p className="text-sm text-slate-700 mt-2">
              <strong>Last Updated:</strong> Weekly automatic retraining enabled
            </p>
            <p className="text-sm text-slate-700 mt-1">
              <strong>Features:</strong> 53 clinical features auto-derived from minimal questionnaire
            </p>
          </div>
        </section>

        {/* Data Collection Status */}
        <section className="mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-50/90 via-pink-50/85 to-blue-50/85 backdrop-blur-2xl border border-purple-200/60 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center border border-purple-300">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Data Collection Insights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <p className="font-bold text-purple-700 mb-2">📊 Feedback Rate</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.feedback_rate || "N/A"}</p>
                  <p className="text-xs text-slate-600 mt-1">of users providing feedback</p>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <p className="font-bold text-purple-700 mb-2">💬 Total Feedback</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.total_feedback || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">feedback entries received</p>
                </div>
                <div className="p-4 bg-white/70 rounded-2xl border-2 border-purple-200">
                  <p className="font-bold text-purple-700 mb-2">🔄 Retraining</p>
                  <p className="text-2xl font-bold text-slate-800">Weekly</p>
                  <p className="text-xs text-slate-600 mt-1">automatic model updates</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Status */}
        <section className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-slate-800">System Status: Healthy</p>
              <p className="text-sm text-slate-700 mt-1">
                All systems operational. Database, scheduler, and online learning are active.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
