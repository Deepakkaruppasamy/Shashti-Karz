"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, Car, CheckCircle, ArrowRight, Sparkles, Zap, ArrowLeft, User, Phone, Mail, FileText, CreditCard } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { AIChatbot } from "@/components/AIChatbot";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { Service, CarType } from "@/lib/types";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { GlowingBorder, PulsingDot } from "@/components/animations/GlowingBorder";
import { MagneticButton, TiltCard } from "@/components/animations/MagneticButton";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { ProgressLoader } from "@/components/animations/CarLoader";
import { SuccessConfetti } from "@/components/animations/ConfettiEffect";

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const stepIcons = [Car, Calendar, User, CheckCircle];
const stepTitles = ["Select Service", "Choose Date & Time", "Your Details", "Confirm Booking"];

function BookingForm() {
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service");
  const preselectedCar = searchParams.get("car");
  const preselectedAddon = searchParams.get("addon");
  const preselectedPackage = searchParams.get("package");
  const preselectedAddons = searchParams.get("addons");
  const preselectedTotal = searchParams.get("total");
  const { user, profile } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    service: preselectedService || "",
    carType: preselectedCar || "",
    carModel: "",
    date: "",
    time: "",
    name: profile?.full_name || "",
    phone: profile?.phone || "",
    email: user?.email || "",
    notes: preselectedAddon ? `Addon: ${preselectedAddon}` : preselectedPackage ? `Package: ${preselectedPackage}` : preselectedAddons ? `Extras: ${preselectedAddons}` : ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [bookingUUID, setBookingUUID] = useState("");
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(preselectedTotal ? parseInt(preselectedTotal) : null);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, carTypesRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/car-types")
        ]);

        if (!servicesRes.ok) throw new Error("Failed to load services");
        if (!carTypesRes.ok) throw new Error("Failed to load car types");

        const servicesData = await servicesRes.json();
        const carTypesData = await carTypesRes.json();

        setServices(Array.isArray(servicesData) ? servicesData : []);
        setCarTypes(Array.isArray(carTypesData) ? carTypesData : []);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load services");
        setServices([]);
        setCarTypes([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone,
        email: user?.email || prev.email
      }));
    }
  }, [profile, user]);

  const selectedService = services.find(s => s.id === formData.service);
  const selectedCarType = carTypes.find(c => c.id === formData.carType);
  const baseServicePrice = 300;
  const finalPrice = customPrice !== null
    ? customPrice
    : (selectedService && selectedCarType
      ? Math.round(baseServicePrice * selectedCarType.price_multiplier)
      : 0);

  const bookingType = preselectedAddon ? `Addon: ${preselectedAddon}`
    : preselectedPackage ? `Package: ${preselectedPackage}`
      : preselectedAddons ? `With extras`
        : null;

  const getAIRecommendation = () => {
    if (formData.carType === "luxury" || formData.carType === "supercar") {
      return services.find(s => s.id === "ceramic-coating");
    }
    if (formData.carType === "suv") {
      return services.find(s => s.id === "full-detailing");
    }
    return services.find(s => s.id === "full-detailing");
  };

  const aiRecommendation = getAIRecommendation();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: formData.service,
          car_type: formData.carType,
          car_model: formData.carModel,
          date: formData.date,
          time: formData.time,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          notes: formData.notes,
          price: finalPrice,
          user_id: user?.id || null,
          status: "pending"
        }),
      });

      if (!response.ok) throw new Error("Failed to create booking");

      const booking = await response.json();
      setBookingId(booking.booking_id);
      setBookingUUID(booking.id);
      setIsComplete(true);
      toast.success("Booking confirmed! Check your email for details.");
    } catch {
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.service && formData.carType && formData.carModel;
      case 2: return formData.date && formData.time;
      case 3: return formData.name && formData.phone && formData.email;
      default: return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const minDate = new Date().toISOString().split("T")[0];
  const progress = (step / 4) * 100;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full"
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#888] text-sm"
        >
          Loading services...
        </motion.p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <>
        <SuccessConfetti trigger={isComplete} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255, 23, 68, 0.4)",
                  "0 0 0 20px rgba(255, 23, 68, 0)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37] flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle size={48} className="text-white" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold font-display mb-4"
          >
            Booking Confirmed!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#888] mb-8"
          >
            Your appointment has been scheduled. We&apos;ll contact you shortly to confirm.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlowingBorder className="rounded-2xl">
              <div className="p-6 bg-[#0a0a0a] rounded-2xl text-left">
                <h3 className="font-semibold mb-4 text-[#d4af37]">Booking Details:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Booking ID:</span>
                    <span className="font-mono">{bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Service:</span>
                    <span>{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Vehicle:</span>
                    <span>{formData.carModel} ({selectedCarType?.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Date & Time:</span>
                    <span>{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                    <span className="text-[#888]">Total Amount:</span>
                    <span className="text-xl font-bold text-gradient">
                      ₹<AnimatedCounter end={finalPrice} duration={1000} />
                    </span>
                  </div>
                </div>
              </div>
            </GlowingBorder>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <MagneticButton>
              <button
                onClick={async () => {
                  if (!bookingUUID) return;
                  setIsPaymentLoading(true);
                  try {
                    const res = await fetch("/api/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ booking_id: bookingUUID }),
                    });
                    if (res.ok) {
                      const { url } = await res.json();
                      window.location.href = url;
                    } else {
                      toast.error("Failed to start payment. Please try again.");
                    }
                  } catch {
                    toast.error("Payment error. Please try again.");
                  } finally {
                    setIsPaymentLoading(false);
                  }
                }}
                disabled={isPaymentLoading}
                className="btn-gold px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 disabled:opacity-50"
              >
                {isPaymentLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={22} />
                    Pay Now - ₹{finalPrice.toLocaleString()}
                  </>
                )}
              </button>
            </MagneticButton>
            <p className="text-sm text-[#888]">or pay later from your dashboard</p>
            <motion.div
              animate={{ x: [0, 100, 200] }}
              transition={{ duration: 2, delay: 0.8 }}
              className="opacity-30"
            >
              <Car size={40} className="text-[#ff1744]" />
            </motion.div>
            <p className="text-xs text-[#666]">Your car is on its way to premium care!</p>
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepTitles.map((title, i) => {
              const StepIcon = stepIcons[i];
              const isActive = step === i + 1;
              const isCompleted = step > i + 1;

              return (
                <motion.div
                  key={i}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <motion.div
                    whileHover={isCompleted ? { scale: 1.1 } : {}}
                    onClick={() => isCompleted && setStep(i + 1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold cursor-pointer transition-all ${isActive
                        ? "bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white shadow-lg shadow-[#ff1744]/30"
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-white/5 text-[#666]"
                      }`}
                  >
                    {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                  </motion.div>
                  <span className={`text-sm hidden sm:block ${isActive ? "text-white" : "text-[#666]"}`}>
                    {title}
                  </span>
                  {i < 3 && (
                    <div className={`w-8 lg:w-16 h-0.5 hidden sm:block ${step > i + 1 ? "bg-green-500" : "bg-white/10"}`} />
                  )}
                </motion.div>
              );
            })}
          </div>
          <ProgressLoader progress={progress} className="mt-2" />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Car size={16} className="text-[#ff1744]" />
                    Select Car Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {carTypes.map((car, i) => (
                      <motion.button
                        key={car.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setFormData({ ...formData, carType: car.id })}
                        className={`p-4 rounded-xl text-left transition-all ${formData.carType === car.id
                            ? "bg-[#ff1744]/20 border-2 border-[#ff1744] shadow-lg shadow-[#ff1744]/20"
                            : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                          }`}
                      >
                        <motion.div
                          animate={formData.carType === car.id ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Car size={24} className={formData.carType === car.id ? "text-[#ff1744]" : "text-[#888]"} />
                        </motion.div>
                        <div className="mt-2 font-medium text-sm">{car.name}</div>
                        <div className="text-xs text-[#666]">{car.price_multiplier}x price</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Car Model / Name</label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    placeholder="e.g., BMW 5 Series, Honda City"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 transition-all"
                  />
                </div>

                {formData.carType && aiRecommendation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <TiltCard maxTilt={5}>
                      <div className="glass-card rounded-xl p-4 border border-[#d4af37]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap size={18} className="text-[#d4af37]" />
                          </motion.div>
                          <span className="text-sm font-semibold text-[#d4af37]">AI Recommendation</span>
                          <PulsingDot color="#d4af37" size={6} />
                        </div>
                        <p className="text-sm text-[#888]">
                          Based on your {selectedCarType?.name}, we recommend <strong className="text-white">{aiRecommendation.name}</strong> for optimal results.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData({ ...formData, service: aiRecommendation.id })}
                          className="mt-2 text-sm text-[#ff1744] hover:underline flex items-center gap-1"
                        >
                          <Sparkles size={14} />
                          Apply Recommendation
                        </motion.button>
                      </div>
                    </TiltCard>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">Select Service</label>
                  <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                    {services.map((service, i) => (
                      <motion.button
                        key={service.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setFormData({ ...formData, service: service.id })}
                        className={`p-4 rounded-xl text-left transition-all flex gap-4 ${formData.service === service.id
                            ? "bg-[#ff1744]/20 border-2 border-[#ff1744] shadow-lg shadow-[#ff1744]/20"
                            : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                          }`}
                      >
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                          <Image src={service.image} alt={service.name} fill className="object-cover" />
                          {formData.service === service.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-[#ff1744]/30 flex items-center justify-center"
                            >
                              <CheckCircle size={24} className="text-white" />
                            </motion.div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{service.name}</h4>
                            {service.popular && (
                              <span className="px-2 py-0.5 bg-[#ff1744] rounded-full text-xs">Popular</span>
                            )}
                          </div>
                          <p className="text-xs text-[#888] mt-1">{service.short_desc}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[#d4af37] font-semibold">
                              ₹{selectedCarType
                                ? Math.round(service.price * selectedCarType.price_multiplier).toLocaleString()
                                : service.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#666]">{service.duration}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-[#ff1744]" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-[#ff1744]" />
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {timeSlots.map((slot, i) => (
                      <motion.button
                        key={slot}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setFormData({ ...formData, time: slot })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${formData.time === slot
                            ? "bg-[#ff1744] text-white shadow-lg shadow-[#ff1744]/30"
                            : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <TiltCard maxTilt={5}>
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={18} className="text-[#d4af37]" />
                      <span className="text-sm font-semibold">AI Smart Suggestion</span>
                    </div>
                    <p className="text-sm text-[#888]">
                      Based on our booking data, <strong className="text-white">10:00 AM</strong> on weekdays typically has the shortest wait times and allows for thorough service without rush.
                    </p>
                  </div>
                </TiltCard>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User size={16} className="text-[#ff1744]" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone size={16} className="text-[#ff1744]" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-[#ff1744]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-[#ff1744]" />
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific requests or concerns..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50 focus:ring-2 focus:ring-[#ff1744]/20 resize-none transition-all"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <MagneticButton>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </motion.button>
            </MagneticButton>
          )}
          {step < 3 ? (
            <MagneticButton className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="w-full btn-premium px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={18} />
              </motion.button>
            </MagneticButton>
          ) : (
            <MagneticButton className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="w-full btn-gold px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <CheckCircle size={18} />
                  </>
                )}
              </motion.button>
            </MagneticButton>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sticky top-28"
        >
          <GlowingBorder className="rounded-2xl">
            <div className="p-6 bg-[#0a0a0a] rounded-2xl">
              <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-[#d4af37]" />
                Booking Summary
              </h3>

              {selectedService ? (
                <div className="space-y-4">
                  <div className="relative h-40 rounded-xl overflow-hidden">
                    <Image
                      src={selectedService.image}
                      alt={selectedService.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-lg font-semibold">{selectedService.name}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {formData.carModel && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[#888]">Vehicle</span>
                        <span>{formData.carModel}</span>
                      </motion.div>
                    )}
                    {selectedCarType && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[#888]">Car Type</span>
                        <span>{selectedCarType.name}</span>
                      </motion.div>
                    )}
                    {formData.date && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[#888]">Date</span>
                        <span>{formData.date}</span>
                      </motion.div>
                    )}
                    {formData.time && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[#888]">Time</span>
                        <span>{formData.time}</span>
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Duration</span>
                      <span>{selectedService.duration}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#888]">Total</span>
                      <motion.span
                        key={finalPrice}
                        initial={{ scale: 1.2, color: "#ff1744" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        className="text-2xl font-bold text-gradient"
                      >
                        ₹{finalPrice.toLocaleString()}
                      </motion.span>
                    </div>
                    <p className="text-xs text-[#666] mt-2">
                      * Final price may vary based on vehicle condition
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#666]">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  </motion.div>
                  <p>Select a service to see booking summary</p>
                </div>
              )}
            </div>
          </GlowingBorder>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-24 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeUp" className="text-center mb-12">
            <span className="text-[#ff1744] text-sm font-semibold tracking-widest uppercase">
              Book Appointment
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-display mt-3 mb-4">
              Schedule Your <span className="text-gradient">Service</span>
            </h1>
            <p className="text-[#888] max-w-xl mx-auto">
              Book your car detailing appointment in just a few clicks.
              Our AI will help you choose the perfect service.
            </p>
          </ScrollReveal>

          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full"
              />
            </div>
          }>
            <BookingForm />
          </Suspense>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
      <AIChatbot />
    </main>
  );
}
