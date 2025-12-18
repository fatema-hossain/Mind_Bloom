"use client";
import { useState } from "react";

type Message = { sender: "user" | "bot"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Allow the user to choose a risk level to receive tailored advice.  An
  // empty string means no risk level provided, so the chatbot will use
  // conversational logic only.
  const [riskLevel, setRiskLevel] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Cast to Message so sender is inferred correctly
    const userMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          // Only include risk_level if the user has selected one; otherwise omit
          ...(riskLevel ? { risk_level: riskLevel } : {}),
        }),
      });
      const data = await res.json();

      const botMsg: Message = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg: Message = {
        sender: "bot",
        text: "Sorry, something went wrong.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-2 bg-gradient-to-b from-purple-50 via-blue-50 to-purple-100">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center p-4 mb-4 backdrop-blur-md bg-white/60 rounded-3xl shadow-sm border border-purple-100">
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-700 uppercase">Mind Bloom Assistant</h1>
          <p className="text-sm text-purple-500">Mental Health Support Chatbot</p>
        </div>
        {/* Back to assessment button (non-functional placeholder) */}
        <button className="px-4 py-2 bg-white/50 hover:bg-white text-purple-700 border border-purple-200 rounded-xl font-medium">← Back to Assessment</button>
      </header>
      {/* Main chat container */}
      <div className="w-full max-w-4xl flex flex-col flex-grow border border-purple-200 rounded-3xl p-4 bg-white/70 shadow-lg backdrop-blur-md">
        
        
        {/* Chat messages area */}
        <div className="flex flex-col space-y-4 overflow-y-auto mb-4 px-1" style={{ minHeight: '400px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`relative px-4 py-3 rounded-2xl max-w-[90%] whitespace-pre-wrap break-words ${
                msg.sender === 'user'
                  ? 'self-end bg-gradient-to-r from-purple-300 to-pink-300 text-purple-900 shadow-sm'
                  : 'self-start bg-white/80 border border-purple-200 text-purple-800 shadow-sm'
              }`}
            >
              {msg.sender === 'bot' && (
                <span className="absolute -top-3 -left-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-sm shadow">★</span>
              )}
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="self-start bg-white/80 border border-purple-200 text-purple-800 px-4 py-3 rounded-2xl shadow-sm">
              …
            </div>
          )}
        </div>
        {/* Input and send button */}
        <div className="flex items-center space-x-2">
          <input
            className="flex-grow border border-purple-200 rounded-xl p-3 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800 placeholder-purple-400"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none transition-colors"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
