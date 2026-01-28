"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles, Loader2, Phone, Calendar, RefreshCw, Mic, Volume2, VolumeX, Minimize2, Maximize2 } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { label: "View Services", icon: "🚗", query: "What services do you offer?" },
  { label: "Get Pricing", icon: "💰", query: "What are your prices?" },
  { label: "Book Now", icon: "📅", query: "How can I book an appointment?" },
  { label: "Current Offers", icon: "🎁", query: "Any current offers or discounts?" },
];

const suggestedQuestions = [
  "What's the difference between ceramic coating and PPF?",
  "Best service for a new car?",
  "How long does full detailing take?",
  "Do you offer pickup service?",
  "What products do you use?",
  "Warranty on ceramic coating?",
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! 👋 Welcome to **Shashti Karz** - Car Detailing Xpert!

I'm your AI assistant, trained on all our services, pricing, and offers. I can help you with:

🚗 **Services & Pricing** - Ceramic coating, PPF, detailing & more
📅 **Booking** - Schedule your appointment
🎁 **Offers** - Current discounts and deals
❓ **Questions** - Anything about car care!

How can I help you today?`
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `I apologize, but I'm having trouble connecting right now. 

📞 Please call us at **+91 98765 43210** for immediate assistance, or try again in a moment.`
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data.message }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `I'm having trouble connecting. Please try again or call us at **+91 98765 43210**.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Chat"
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full blur-lg opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-lg">
            <Bot size={26} className="text-white" />
          </div>
          <motion.span
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:block"
        >
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white whitespace-nowrap border border-white/10">
            Chat with AI
          </div>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "auto" : 540
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-6 z-50 w-[400px] max-w-[calc(100vw-48px)] overflow-hidden"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-[#0d0d0d]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#ff1744]/5 to-transparent pointer-events-none" />
              
              <div className="relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff1744] to-transparent" />
                
                <div className="p-4 flex items-center justify-between bg-[#0d0d0d]/90 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full blur-md opacity-50" />
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                      </div>
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Shashti AI Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-xs text-white/60">Online • GPT Powered</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetChat}
                      className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Reset Chat"
                    >
                      <RefreshCw size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title={isMinimized ? "Expand" : "Minimize"}
                    >
                      {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-white/50 hover:text-[#ff1744] hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {!isMinimized && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="h-[360px] overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[#0a0a0a]">
                        {messages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`relative max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-gradient-to-r from-[#ff1744] to-[#ff4569] text-white rounded-br-sm"
                                  : "bg-white/5 text-white/90 rounded-bl-sm border border-white/5"
                              }`}
                            >
                              {msg.role === "assistant" && (
                                <div className="absolute -left-1 -top-1 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                                  <Bot size={12} className="text-white" />
                                </div>
                              )}
                              <div
                                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                className={msg.role === "assistant" ? "pl-4" : ""}
                              />
                            </div>
                          </motion.div>
                        ))}
                        
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-white/5 p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 border border-white/5">
                              <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.span
                                    key={i}
                                    className="w-2 h-2 bg-[#ff1744] rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      delay: i * 0.15,
                                      repeat: Infinity,
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-white/50">Analyzing...</span>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {showSuggestions && messages.length <= 1 && (
                        <div className="px-4 pb-2 bg-[#0a0a0a]">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {quickActions.map((action, i) => (
                              <motion.button
                                key={action.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => sendMessage(action.query)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm text-white/80 transition-colors border border-white/5"
                              >
                                <span>{action.icon}</span>
                                <span>{action.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 border-t border-white/5 bg-[#0d0d0d]">
                        {!showSuggestions && messages.length > 2 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 mb-3"
                          >
                            {suggestedQuestions.slice(0, 3).map((q) => (
                              <motion.button
                                key={q}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => sendMessage(q)}
                                className="px-3 py-1.5 text-xs rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors truncate max-w-[180px] border border-white/5"
                              >
                                {q}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                        
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              ref={inputRef}
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Ask me anything..."
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff1744]/50 focus:ring-1 focus:ring-[#ff1744]/20 disabled:opacity-50 transition-all"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                            >
                              <Mic size={16} />
                            </motion.button>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => sendMessage(input)}
                            disabled={isLoading || !input.trim()}
                            className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ff1744]/20 transition-all"
                          >
                            {isLoading ? (
                              <Loader2 size={20} className="text-white animate-spin" />
                            ) : (
                              <Send size={20} className="text-white" />
                            )}
                          </motion.button>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-2 h-2 bg-green-500 rounded-full"
                            />
                            <span className="text-xs text-white/30">Powered by OpenAI</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <a
                              href="tel:+919876543210"
                              className="flex items-center gap-1 text-xs text-white/50 hover:text-[#ff1744] transition-colors"
                            >
                              <Phone size={12} />
                              Call
                            </a>
                            <Link
                              href="/booking"
                              className="flex items-center gap-1 text-xs text-white/50 hover:text-[#d4af37] transition-colors"
                            >
                              <Calendar size={12} />
                              Book
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
              </div>
              
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#ff1744]/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#ff1744]/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#d4af37]/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#d4af37]/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
