"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface LLMStatus {
  llm_available: boolean;
  active_provider: string;
  fallback_available: boolean;
  supported_providers: string[];
}

const PROVIDER_INFO: Record<string, { name: string; models: string[]; description: string }> = {
  openai: {
    name: "OpenAI",
    models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    description: "GPT models from OpenAI"
  },
  gemini: {
    name: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    description: "Gemini models from Google AI"
  },
  mistral: {
    name: "Mistral AI",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
    description: "Mistral AI models"
  },
  anthropic: {
    name: "Anthropic Claude",
    models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    description: "Claude models from Anthropic"
  },
  openrouter: {
    name: "OpenRouter",
    models: ["mistralai/mixtral-8x22b-instruct", "openai/gpt-4", "anthropic/claude-3-opus"],
    description: "Access multiple providers via OpenRouter"
  }
};

export default function LLMSettingsPage() {
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Form state
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<{provider: string; model: string} | null>(null);
  const [availableModels, setAvailableModels] = useState<Array<{id: string; name: string; description: string}>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Admin check
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status
    const checkAdmin = () => {
      try {
        const userStr = localStorage.getItem("mindbloom_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user.role === "admin");
        }
      } catch {}
    };
    checkAdmin();
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch LLM status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "API key is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/llm/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          model: model || null,
          base_url: customBaseUrl || null
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: `${data.active_provider} configured successfully!` });
        setApiKey(""); // Clear for security
        fetchStatus();
      } else {
        setMessage({ type: "error", text: data.message || "Configuration failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/llm/test`, {
        method: "POST"
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: `Connection test passed! Provider: ${data.provider}` });
      } else {
        setMessage({ type: "error", text: data.error || "Connection test failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to test connection" });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the LLM configuration and revert to fallback?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/llm/configure`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Configuration cleared. Using fallback chatbot." });
        fetchStatus();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to clear configuration" });
    }
  };

  const handleAutoDetect = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "Enter an API key first to auto-detect the provider" });
      return;
    }

    setDetecting(true);
    setMessage(null);
    setDetectedInfo(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/llm/auto-detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });

      const data = await res.json();

      if (data.success) {
        setDetectedInfo({ provider: data.provider, model: data.model });
        setProvider(data.provider);
        if (data.model) setModel(data.model);
        setMessage({ type: "success", text: `✅ ${data.message}` });
        // Also fetch available models
        await fetchAvailableModels(data.provider);
        setApiKey(""); // Clear key after successful config
        fetchStatus();
      } else {
        setMessage({ type: "error", text: data.message || "Could not detect provider" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to auto-detect provider" });
    } finally {
      setDetecting(false);
    }
  };

  const fetchAvailableModels = async (providerName?: string) => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "Enter an API key first to list models" });
      return;
    }

    setLoadingModels(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/llm/list-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          api_key: apiKey,
          provider: providerName || provider 
        })
      });

      const data = await res.json();

      if (data.success && data.models?.length > 0) {
        setAvailableModels(data.models);
        if (data.recommended && !model) {
          setModel(data.recommended);
        }
        setMessage({ type: "success", text: `✅ Found ${data.models.length} available models!` });
      } else {
        setMessage({ type: "error", text: data.message || "No models found" });
        setAvailableModels([]);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to fetch models" });
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }}>
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-red-200 text-center max-w-md">
          <span className="text-5xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Admin Access Required</h1>
          <p className="text-slate-600 mb-4">You must be logged in as an admin to access LLM settings.</p>
          <Link href="/login" className="text-purple-600 hover:underline font-semibold">
            Go to Login →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pt-20 sm:pt-24" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-100/90 via-purple-50/80 to-pink-100/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl rounded-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border-2 border-green-300 text-2xl">
                🤖
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">LLM Configuration</h1>
                <p className="text-xs sm:text-sm text-slate-600">Admin-only: Configure AI chatbot provider</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all duration-300 font-medium text-slate-700 text-sm"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📊</span> Current Status
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ) : status ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border-2 ${status.llm_available ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                <p className="text-sm font-semibold text-slate-600">LLM Status</p>
                <p className={`text-lg font-bold ${status.llm_available ? 'text-green-700' : 'text-amber-700'}`}>
                  {status.llm_available ? '✅ Active' : '⚠️ Using Fallback'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300">
                <p className="text-sm font-semibold text-slate-600">Active Provider</p>
                <p className="text-lg font-bold text-blue-700">{status.active_provider}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300">
                <p className="text-sm font-semibold text-slate-600">Fallback</p>
                <p className="text-lg font-bold text-purple-700">
                  {status.fallback_available ? '✅ Available' : '❌ Not Available'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Failed to load status</p>
          )}
        </div>

        {/* Configuration Form */}
        <div className="mb-6 p-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Configure LLM Provider
          </h2>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-xl border-2 ${
              message.type === "success" 
                ? "bg-green-50 border-green-300 text-green-800" 
                : "bg-red-50 border-red-300 text-red-800"
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setModel(""); // Reset model when provider changes
                }}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 bg-white"
              >
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                  <option key={key} value={key}>{info.name} - {info.description}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setDetectedInfo(null); // Clear previous detection
                  }}
                  placeholder="Paste your API key here..."
                  className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200"
                />
                <button
                  onClick={handleAutoDetect}
                  disabled={detecting || !apiKey.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {detecting ? "🔍 Detecting..." : "🔍 Auto-Detect"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Paste your API key and click Auto-Detect - we&apos;ll identify the provider automatically!
              </p>
              
              {/* Detection Result */}
              {detectedInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-xl">
                  <p className="text-sm text-green-800">
                    <span className="font-bold">Detected:</span> {detectedInfo.provider} 
                    {detectedInfo.model && <span className="text-green-600"> • Model: {detectedInfo.model}</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Model
              </label>
              <div className="flex gap-2">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 bg-white"
                >
                  <option value="">Default model</option>
                  
                  {/* Show fetched models if available */}
                  {availableModels.length > 0 ? (
                    <>
                      <optgroup label="✅ Available Models (from your API key)">
                        {availableModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.id}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    /* Fallback to static list */
                    <optgroup label="Common Models">
                      {PROVIDER_INFO[provider]?.models.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                
                <button
                  onClick={() => fetchAvailableModels()}
                  disabled={loadingModels || !apiKey.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loadingModels ? "⏳ Loading..." : "📋 List Models"}
                </button>
              </div>
              
              {/* Show model count if fetched */}
              {availableModels.length > 0 && (
                <p className="mt-1 text-xs text-green-600 font-medium">
                  ✅ {availableModels.length} models found from your API key
                </p>
              )}
              {!availableModels.length && (
                <p className="mt-1 text-xs text-slate-500">
                  Click &quot;List Models&quot; after entering your API key to see available models
                </p>
              )}
            </div>

            {/* Custom Base URL (for custom/self-hosted) */}
            {provider === "custom" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Base URL (for custom endpoints)
                </label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://your-api.example.com/v1"
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="flex-1 min-w-[150px] px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "💾 Save Configuration"}
              </button>
              
              <button
                onClick={handleTest}
                disabled={testing || !status?.llm_available}
                className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? "Testing..." : "🔌 Test Connection"}
              </button>
              
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold rounded-xl hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🗑️ Clear & Use Fallback
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-gradient-to-br from-amber-50/90 to-yellow-50/90 backdrop-blur-xl rounded-3xl shadow-xl border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span>💡</span> How It Works
          </h3>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>With API Key:</strong> Chatbot uses the selected LLM provider for intelligent, context-aware responses.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Without API Key:</strong> Falls back to rule-based chatbot with predefined PPD guidance (free, no API needed).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Supported Providers:</strong> OpenAI, Google Gemini, Mistral, Anthropic Claude, OpenRouter (multi-model access).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Security:</strong> API keys are only stored in server memory, never in the database or browser.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

