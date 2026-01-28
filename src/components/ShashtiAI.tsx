"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, RefreshCw, Brain, TrendingUp, Gift, Car, Calendar, Sparkles, User, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type UserRole = "guest" | "customer" | "admin";

const quickActions = {
  guest: [
    { label: "View Services", icon: Car, query: "What services do you offer?", color: "#ff1744" },
    { label: "Get Pricing", icon: TrendingUp, query: "What are your prices?", color: "#d4af37" },
    { label: "Book Now", icon: Calendar, query: "How can I book?", color: "#4CAF50" },
    { label: "Current Offers", icon: Gift, query: "Any current offers?", color: "#9c27b0" },
  ],
  customer: [
    { label: "Track My Car", icon: Car, query: "What's my service status?", color: "#9c27b0" },
    { label: "My Points", icon: Star, query: "How many points do I have?", color: "#d4af37" },
    { label: "Book Service", icon: Calendar, query: "I want to book a service", color: "#4CAF50" },
    { label: "Recommendations", icon: Sparkles, query: "What do you recommend?", color: "#ff1744" },
  ],
  admin: [
    { label: "Today's Stats", icon: TrendingUp, query: "Show today's performance", color: "#4CAF50" },
    { label: "Pending Tasks", icon: Calendar, query: "What needs attention?", color: "#FF9800" },
    { label: "Revenue", icon: TrendingUp, query: "How is revenue trending?", color: "#d4af37" },
    { label: "AI Insights", icon: Brain, query: "Give me business insights", color: "#9c27b0" },
  ]
};

export function ShashtiAI() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("guest");
  const [userName, setUserName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && profile) {
      const isAdmin = profile.email?.includes("admin") || profile.email === "deepanshukumar2004@gmail.com";
      setUserRole(isAdmin ? "admin" : "customer");
      setUserName(profile.full_name || user.email?.split("@")[0] || "");
    } else {
      setUserRole("guest");
      setUserName("");
    }
  }, [user, profile]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting();
      setMessages([{ role: "assistant", content: greeting, timestamp: new Date() }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function getGreeting(): string {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    
    if (userRole === "admin") {
      return `${timeGreeting}, ${userName || "Admin"}!\n\nI'm **Shashti AI**, your operations assistant. I can help with analytics, insights, and business recommendations.\n\nHow can I assist you today?`;
    }
    
    if (userRole === "customer") {
      return `${timeGreeting}, ${userName || "there"}!\n\nWelcome back to **Shashti Karz**! I can help you track services, book appointments, and more.\n\nWhat would you like to do?`;
    }
    
    return `Hello! Welcome to **Shashti Karz** - Car Detailing Xpert!\n\nI'm **Shashti AI**. I can help with services, pricing, offers, and booking.\n\nHow can I help you today?`;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);
    setIsTyping(true);

    try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            context: { role: userRole, userName, language }
          }),
        });


      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "I'm having trouble right now. Please call us at **+91 98765 43210**.",
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.message, timestamp: new Date() }]);
      }
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Connection error. Please try again or call **+91 98765 43210**.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function resetChat() {
    setMessages([]);
    setShowSuggestions(true);
  }

  function formatMessage(content: string) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, '<br />');
  }

  const currentQuickActions = quickActions[userRole] || quickActions.guest;

  const getRoleIcon = () => {
    switch (userRole) {
      case "admin": return <Shield size={10} className="text-purple-400" />;
      case "customer": return <User size={10} className="text-green-400" />;
      default: return <Star size={10} className="text-yellow-400" />;
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case "admin": return "Admin";
      case "customer": return "Customer";
      default: return "Guest";
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-[9000] group"
          aria-label="Open Shashti AI"
        >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full blur-md opacity-60 animate-pulse" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-[#ff1744] rounded-full" 
              />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center border border-white/20 hover:border-[#ff1744]/50 transition-colors">
                <Brain size={26} className="text-[#ff1744]" />
              </div>

            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />
          </div>
        </button>
      )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-6 left-6 z-[9999] w-[360px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-100px)]"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a] flex flex-col max-h-[500px]">
                <div className="p-3 flex items-center justify-between bg-gradient-to-r from-[#111] to-[#0d0d0d] border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center">
                      <Brain size={18} className="text-[#ff1744]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">Shashti AI</h3>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 flex items-center gap-1">
                          {getRoleIcon()}
                          {getRoleBadge()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-[10px] text-white/50">{isTyping ? "Typing..." : "Online"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={resetChat}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Reset chat"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-white/40 hover:text-[#ff1744] hover:bg-[#ff1744]/10 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#080808] min-h-0 max-h-[280px]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#ff1744] to-[#d32f2f] text-white rounded-br-sm"
                        : "bg-white/5 text-white/90 rounded-bl-sm border border-white/5"
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                      <span className="block text-[9px] text-white/30 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 border border-white/5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 bg-[#ff1744] rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

                {showSuggestions && messages.length <= 1 && (
                  <div className="px-3 pb-2 bg-[#080808] shrink-0">
                    <div className="grid grid-cols-2 gap-1.5">
                      {currentQuickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => sendMessage(action.query)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 text-[11px] text-white/80 hover:bg-white/10 border border-white/5 transition-colors"
                          >
                            <Icon size={12} style={{ color: action.color }} />
                            <span className="truncate">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-2.5 border-t border-white/10 bg-[#0d0d0d] shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff1744]/50 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage(input)}
                      disabled={isLoading || !input.trim()}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="text-white animate-spin" />
                      ) : (
                        <Send size={16} className="text-white" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                    <span className="text-[10px] text-white/30">Powered by Shashti AI</span>
                    <Link href="/booking" className="text-[10px] text-[#d4af37] hover:underline flex items-center gap-1">
                      <Calendar size={10} />
                      Book Service
                    </Link>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
