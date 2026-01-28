"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { toast } from "sonner";
import type { Service } from "@/lib/types";

export default function ContactPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });

  useEffect(() => {
    fetch("/api/services")
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to submit");

      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <section className="pt-32 pb-24 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#ff1744] text-sm font-semibold tracking-widest uppercase"
            >
              Get In Touch
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold font-display mt-3 mb-4"
            >
              Contact <span className="text-gradient">Us</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#888] max-w-xl mx-auto"
            >
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubmit}
                className="glass-card rounded-2xl p-8 space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Your name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Service Interested In</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff1744]/50"
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="Tell us about your requirements..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-premium px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </motion.form>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4 text-lg">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ff1744]/20 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-[#ff1744]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-[#888] text-sm">Avinashi Road, Tirupur, Tamil Nadu 641652</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ff1744]/20 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-[#ff1744]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <a href="tel:+919876543210" className="text-[#888] text-sm hover:text-[#ff1744]">+91 98765 43210</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ff1744]/20 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-[#ff1744]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <a href="mailto:info@shashtikarz.com" className="text-[#888] text-sm hover:text-[#ff1744]">info@shashtikarz.com</a>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4 text-lg">Business Hours</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#888]">Monday - Friday</span>
                    <span>9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#888]">Saturday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#888]">Sunday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                </div>
              </motion.div>

              <motion.a
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-green-500/50 transition-colors block"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MessageCircle size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Chat on WhatsApp</p>
                  <p className="text-sm text-[#888]">Quick response guaranteed</p>
                </div>
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
