"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Wrapper component to handle Suspense for useSearchParams
function ChatbotContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with patient data from URL params
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        setPatientData(decoded);
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm the Mind Bloom assistant. I've reviewed your assessment results showing a ${decoded.risk_level || decoded.prediction || "completed"} risk level. I'm here to help you understand the results and answer any questions you may have. How can I support you today?`
          }
        ]);
      } catch (e) {
        console.error("Failed to parse patient data:", e);
        setMessages([
          {
            role: "assistant",
            content: "Hello! I'm the Mind Bloom assistant. I couldn't load your assessment data. Please complete an assessment first, or feel free to ask general questions about postpartum depression."
          }
        ]);
      }
    } else {
      // No data provided - allow general chat
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm the Mind Bloom mental health assistant. I'm here to help answer questions about postpartum depression and provide support. For personalized insights, please complete an assessment first. How can I help you today?"
        }
      ]);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_json: patientData || { note: "No assessment data available" },
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else if (data.detail) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, there was an error: ${data.detail}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I couldn't process that request. Please try again." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting to the server. Please check if the backend is running and try again." }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Background effects (matching Mind Bloom style)
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);

  useEffect(() => {
    setFireflies(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 4}s`,
      size: `${3 + Math.random() * 3}px`,
    })));

    setStars(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
    })));
  }, []);

  return (
    <main className="min-h-screen flex flex-col text-slate-800 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }}>
      {/* Background Effects */}
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

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 pt-20 sm:pt-24">
        {/* Header */}
        <div className="mb-4 p-4 sm:p-6 bg-gradient-to-br from-blue-100/90 via-purple-50/80 to-pink-100/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl rounded-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border-2 border-blue-300 text-2xl">
                💬
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black" style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.05em',
                  backgroundImage: 'linear-gradient(180deg, #d896e8 0%, #ff69d9 50%, #4d0048 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  MIND BLOOM ASSISTANT
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">AI-Powered Mental Health Support</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/assessment"
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded-xl border-2 border-purple-300 hover:border-purple-400 transition-all duration-300 font-medium text-purple-700 text-sm"
              >
                ← Assessment
              </Link>
              <Link
                href="/"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all duration-300 font-medium text-slate-700 text-sm"
              >
                Home
              </Link>
            </div>
          </div>
          
          {/* Patient Context Badge */}
          <div className="mt-3 flex flex-wrap gap-2">
            {patientData && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-xl inline-flex items-center gap-2 text-green-700 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Assessment data loaded - {patientData.risk_level || patientData.prediction || "Personalized"} context active
              </div>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl rounded-3xl p-4 sm:p-6 min-h-[500px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 max-h-[60vh]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white"
                      : "bg-gradient-to-br from-white/95 to-blue-50/95 text-slate-800 border border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center flex-shrink-0 border border-blue-300 text-sm">
                        🌸
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border border-blue-300">
                      🌸
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2 sm:gap-3 items-end border-t border-purple-200/60 pt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your assessment, PPD symptoms, coping strategies..."
              className="flex-1 min-h-[50px] max-h-28 px-3 sm:px-4 py-3 border-2 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 bg-white/90 text-slate-900 placeholder-slate-500 resize-none text-sm"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white font-bold rounded-2xl hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[50px] flex items-center gap-1 sm:gap-2 text-sm"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-3 text-center text-xs text-slate-600 px-4">
          <p>This AI assistant provides general support and information. For medical emergencies or crisis situations, please contact a healthcare professional or emergency services immediately.</p>
        </div>
      </div>
    </main>
  );
}

// Main export with Suspense wrapper
export default function ChatbotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border-2 border-blue-300 text-3xl animate-pulse">
            💬
          </div>
          <p className="text-slate-600">Loading chatbot...</p>
        </div>
      </div>
    }>
      <ChatbotContent />
    </Suspense>
  );
}

