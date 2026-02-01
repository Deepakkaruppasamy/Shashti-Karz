"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Send, Volume2, VolumeX, MessageCircle, HeadphonesIcon, Settings, Languages, User, Sliders, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VoiceAssistantContext, VoiceSettings } from "@/lib/types";
import { getDineshSoundManager } from "@/lib/dinesh-sounds";
import { detectLanguage, languageResponses, matchesCategory } from "@/lib/dinesh-languages";
import { getServiceRecommendations, generateRecommendationResponse, isProblemQuery } from "@/lib/dinesh-recommendations";
import { getServiceRecommendations, generateRecommendationResponse, isProblemQuery } from "@/lib/dinesh-recommendations";
import { toast } from "sonner";
import { CustomerFeedbackForm } from "@/components/dinesh/CustomerFeedbackForm";
import { SupportRequestForm } from "@/components/dinesh/SupportRequestForm";

interface DineshProps {
    userName?: string;
    userId?: string;
}

export function DineshVoiceAssistant({ userName, userId }: DineshProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [conversation, setConversation] = useState<Array<{ role: "user" | "assistant"; message: string; timestamp: Date }>>([]);
    const [sessionId] = useState(() => crypto.randomUUID());
    const [isMuted, setIsMuted] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<"chat" | "feedback" | "support">("chat");
    const [settings, setSettings] = useState<VoiceSettings>({
        voiceGender: "male",
        voiceName: "",
        speechRate: 1.0,
        pitch: 1.0,
        language: "en-US",
        soundEffectsEnabled: true
    });

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const sounds = getDineshSoundManager();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                // Use the selected language from settings
                recognitionRef.current.lang = settings.language;

                recognitionRef.current.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                    setTranscript(transcriptText);

                    if (event.results[current].isFinal) {
                        handleUserQuery(transcriptText);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }

            // Initialize Speech Synthesis
            synthRef.current = window.speechSynthesis;
        }

        // Greet user when opened
        if (isOpen) {
            sounds.setEnabled(settings.soundEffectsEnabled);
            if (conversation.length === 0) {
                sounds.playOpen();
                const welcomeMsg = languageResponses[settings.language].greeting;
                const greeting = userName
                    ? welcomeMsg.replace("Hello!", `Hi ${userName}!`)
                    : welcomeMsg;
                addMessage("assistant", greeting);
                // Speak greeting in the selected language
                speak(greeting, settings.language);
            }
        }
    }, [isOpen, settings.language, settings.soundEffectsEnabled]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            sounds.playListeningStop();
        } else {
            // Ensure correct language is set before starting
            if (recognitionRef.current) {
                recognitionRef.current.lang = settings.language;
            }
            recognitionRef.current?.start();
            setIsListening(true);
            setTranscript("");
            sounds.playListeningStart();
        }
    };

    const speak = (text: string, lang: string = settings.language) => {
        if (isMuted || !synthRef.current) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.speechRate;
        utterance.pitch = settings.pitch;
        utterance.volume = 1.0;
        utterance.lang = lang;

        // Try to find matching voice for gender if voiceName not set
        if (!settings.voiceName && synthRef.current) {
            const voices = synthRef.current.getVoices();
            const preferredVoice = voices.find(v =>
                v.lang.includes(lang.split('-')[0]) &&
                (settings.voiceGender === "female" ?
                    (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Samantha")) :
                    (v.name.includes("Male") || v.name.includes("Google") || v.name.includes("David")))
            );
            if (preferredVoice) utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        synthRef.current?.cancel();
        setIsSpeaking(false);
    };

    const addMessage = (role: "user" | "assistant", message: string) => {
        setConversation(prev => [...prev, { role, message, timestamp: new Date() }]);
    };

    const handleUserQuery = async (query: string) => {
        addMessage("user", query);
        setTranscript("");

        // Process query and get response + detected language
        const { text: reply, lang } = await processQuery(query);

        addMessage("assistant", reply);
        setResponse(reply);
        speak(reply, lang);

        // Log interaction
        logInteraction(query, reply);
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            sounds.playMessageSent();
            handleUserQuery(textInput);
            setTextInput("");
        }
    };

    const processQuery = async (query: string): Promise<{ text: string, lang: string }> => {
        // Step 1: Detect language from the query string (for typed input or auto-switching)
        const detectedLang = detectLanguage(query);

        // Use detected language if it's strictly non-English (strong signal), otherwise use settings
        const activeLang = detectedLang !== "en-US" ? detectedLang : settings.language;

        const lowerQuery = query.toLowerCase();

        // Step 2: Check for AI service recommendations if it's a problem query
        if (isProblemQuery(query)) {
            const recs = getServiceRecommendations(query, activeLang);
            if (recs.length > 0) {
                sounds.playSuccess();
                return {
                    text: generateRecommendationResponse(query, recs, activeLang),
                    lang: activeLang
                };
            }
        }

        // ========== MULTI-LANGUAGE NAVIGATION ==========

        // Homepage
        if (matchesCategory(query, "home", activeLang)) {
            setTimeout(() => router.push("/"), 1000);
            return {
                text: languageResponses[activeLang].home || "Taking you to the homepage now.",
                lang: activeLang
            };
        }

        // Booking
        if (matchesCategory(query, "booking", activeLang)) {
            setTimeout(() => router.push("/booking"), 1000);
            return {
                text: languageResponses[activeLang].bookingResponse,
                lang: activeLang
            };
        }

        // Services
        if (matchesCategory(query, "services", activeLang) && !lowerQuery.includes("track")) {
            setTimeout(() => router.push("/services"), 1000);
            return {
                text: languageResponses[activeLang].servicesResponse,
                lang: activeLang
            };
        }

        // Pricing
        if (matchesCategory(query, "pricing", activeLang)) {
            setTimeout(() => router.push("/booking"), 1000);
            return {
                text: languageResponses[activeLang].pricingResponse,
                lang: activeLang
            };
        }

        // Support/Help
        if (matchesCategory(query, "help", activeLang)) {
            return {
                text: languageResponses[activeLang].supportResponse,
                lang: activeLang
            };
        }

        // Thanks
        if (matchesCategory(query, "thanks", activeLang)) {
            return {
                text: languageResponses[activeLang].thanksResponse,
                lang: activeLang
            };
        }

        // Track/Orders
        if (matchesCategory(query, "track", activeLang)) {
            setTimeout(() => router.push("/dashboard"), 1000);
            return {
                text: "Opening your dashboard to track bookings.", // TODO: Add to languageResponses
                lang: "en-US" // Partial fallback
            };
        }

        // If we are here, we might need English fallback for specific complex queries not yet localized
        // or generic responses.

        // For Hindi/Tamil specific unhandled queries, give a generic help response in that language
        if (activeLang !== "en-US") {
            return {
                text: languageResponses[activeLang].defaultResponse,
                lang: activeLang
            };
        }

        // ... existing English logic ...

        // Gallery
        if (lowerQuery.includes("gallery") || lowerQuery.includes("photos") || lowerQuery.includes("pictures") || lowerQuery.includes("before after")) {
            setTimeout(() => router.push("/gallery"), 1000);
            return { text: "Opening our gallery to show you amazing before and after transformations of vehicles we've worked on.", lang: "en-US" };
        }

        // About Us
        if (lowerQuery.includes("about") || lowerQuery.includes("who are you") || lowerQuery.includes("your company")) {
            setTimeout(() => router.push("/about"), 1000);
            return { text: "Let me tell you about Shashti Karz. We're a premium car detailing service with years of experience in automotive care.", lang: "en-US" };
        }

        // Contact
        if (lowerQuery.includes("contact") || lowerQuery.includes("reach you") || lowerQuery.includes("phone number")) {
            setTimeout(() => router.push("/contact"), 1000);
            return { text: "Here's our contact information. You can call us, send a message, or visit our location.", lang: "en-US" };
        }

        // Virtual Tour
        if (lowerQuery.includes("virtual tour") || lowerQuery.includes("360") || lowerQuery.includes("tour")) {
            setTimeout(() => router.push("/virtual-tour"), 1000);
            return { text: "Let me show you our 360-degree virtual tour! You can explore our facility virtually.", lang: "en-US" };
        }

        // ========== CUSTOMER DASHBOARD ==========

        // My Bookings
        if (lowerQuery.includes("my booking") || lowerQuery.includes("track") || lowerQuery.includes("order status") || lowerQuery.includes("booking history")) {
            setTimeout(() => router.push("/dashboard"), 1000);
            return { text: "Opening your dashboard where you can track all your bookings and services.", lang: "en-US" };
        }

        // Profile
        if (lowerQuery.includes("profile") || lowerQuery.includes("account") || lowerQuery.includes("my account") || lowerQuery.includes("settings")) {
            setTimeout(() => router.push("/dashboard"), 1000);
            return { text: "Opening your profile page where you can manage your account settings.", lang: "en-US" };
        }

        // Rewards & Loyalty
        if (lowerQuery.includes("reward") || lowerQuery.includes("loyalty") || lowerQuery.includes("points") || lowerQuery.includes("gamification")) {
            setTimeout(() => router.push("/rewards"), 1000);
            return { text: "Let me show you your loyalty rewards and points! You can redeem them for discounts and exclusive benefits.", lang: "en-US" };
        }

        // Vehicles
        if (lowerQuery.includes("my car") || lowerQuery.includes("my vehicle") || lowerQuery.includes("add vehicle") || lowerQuery.includes("manage vehicle")) {
            setTimeout(() => router.push("/dashboard/vehicles"), 1000);
            return { text: "Opening your vehicle management page where you can add and manage your cars.", lang: "en-US" };
        }

        // Invoices
        if (lowerQuery.includes("invoice") || lowerQuery.includes("bill") || lowerQuery.includes("receipt")) {
            setTimeout(() => router.push("/dashboard/invoices"), 1000);
            return { text: "Opening your invoices page where you can view and download all your payment receipts.", lang: "en-US" };
        }

        // Notifications
        if (lowerQuery.includes("notification") || lowerQuery.includes("alerts") || lowerQuery.includes("updates")) {
            setTimeout(() => router.push("/dashboard/notifications"), 1000);
            return { text: "Opening your notifications to show you all updates and alerts.", lang: "en-US" };
        }

        // Referrals
        if (lowerQuery.includes("referral") || lowerQuery.includes("refer") || lowerQuery.includes("invite friend")) {
            setTimeout(() => router.push("/dashboard/referrals"), 1000);
            return { text: "Opening your referral page! Refer friends and earn rewards for every successful referral.", lang: "en-US" };
        }

        // ========== SERVICE INFORMATION ==========

        // Service Duration
        if (lowerQuery.includes("how long") || lowerQuery.includes("duration") || lowerQuery.includes("time take")) {
            return { text: "Service duration varies: Basic wash takes 30-45 minutes, interior cleaning takes 1-2 hours, full detailing takes 3-4 hours, and premium ceramic coating can take 6-8 hours for the best results.", lang: "en-US" };
        }

        // Ceramic Coating
        if (lowerQuery.includes("ceramic") || lowerQuery.includes("coating") || lowerQuery.includes("protection")) {
            return { text: "Our ceramic coating provides long-lasting protection with a brilliant shine! It lasts 2-5 years and protects against UV rays, chemicals, water spots, and minor scratches. It's like armor for your car's paint. Would you like to book this service?", lang: "en-US" };
        }

        // Paint Protection Film (PPF)
        if (lowerQuery.includes("ppf") || lowerQuery.includes("paint protection film") || lowerQuery.includes("clear bra")) {
            return { text: "Paint Protection Film is a transparent, thermoplastic urethane film that protects your car's paint from rock chips, scratches, and environmental damage. It's self-healing and virtually invisible. Perfect for new cars or high-end vehicles!", lang: "en-US" };
        }

        // Detailing
        if (lowerQuery.includes("detail") || lowerQuery.includes("deep clean")) {
            return { text: "Our full detailing service includes deep interior cleaning, exterior wash and wax, engine bay cleaning, tire dressing, and more. We'll make your car look brand new! It typically takes 3-4 hours.", lang: "en-US" };
        }

        // Interior Cleaning
        if (lowerQuery.includes("interior") && (lowerQuery.includes("clean") || lowerQuery.includes("service"))) {
            return { text: "Our interior cleaning includes vacuuming, steam cleaning, leather conditioning, dashboard polishing, and odor removal. We'll make your cabin spotless and fresh!", lang: "en-US" };
        }

        // Headlight Restoration
        if (lowerQuery.includes("headlight") || lowerQuery.includes("foggy light") || lowerQuery.includes("yellow headlight")) {
            return { text: "Headlight restoration removes yellowing and cloudiness, improving visibility and appearance. The process includes sanding, polishing, and UV-protective coating. Takes about 1 hour.", lang: "en-US" };
        }

        // ========== FLEET SERVICES ==========

        if (lowerQuery.includes("fleet") || lowerQuery.includes("business") || lowerQuery.includes("commercial") || lowerQuery.includes("multiple cars")) {
            setTimeout(() => router.push("/fleet"), 1000);
            return { text: "We offer special fleet services for businesses! Get volume discounts, priority scheduling, and dedicated account management. Let me show you our fleet packages.", lang: "en-US" };
        }

        // ========== SUBSCRIPTIONS ==========

        if (lowerQuery.includes("subscription") || lowerQuery.includes("monthly plan") || lowerQuery.includes("package")) {
            return { text: "We offer convenient subscription plans for regular car care! Choose from monthly or quarterly packages with unlimited washes, discounts on premium services, and priority booking. Would you like to see our plans?", lang: "en-US" };
        }

        // ========== OFFERS & PROMOTIONS ==========

        if (lowerQuery.includes("offer") || lowerQuery.includes("deal") || lowerQuery.includes("discount") || lowerQuery.includes("promo") || lowerQuery.includes("coupon")) {
            return { text: "We have exciting offers running! Check our homepage for current promotions. New customers get 20% off their first service, and we have seasonal discounts too!", lang: "en-US" };
        }

        // ========== REVIEWS & TESTIMONIALS ==========

        if (lowerQuery.includes("review") || lowerQuery.includes("rating") || lowerQuery.includes("testimonial") || lowerQuery.includes("customer feedback")) {
            return { text: "We have a 5-star rating on Google! Our customers love our attention to detail and premium service. You can read reviews on our website or check out video testimonials from happy customers.", lang: "en-US" };
        }

        // ========== PAYMENT & BILLING ==========

        if (lowerQuery.includes("payment method") || lowerQuery.includes("how to pay") || lowerQuery.includes("pay")) {
            return { text: "We accept all major payment methods: Credit/Debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Digital Wallets. Payment is secure and processed after service completion.", lang: "en-US" };
        }

        if (lowerQuery.includes("refund") || lowerQuery.includes("cancel") || lowerQuery.includes("money back")) {
            return { text: "We have a flexible cancellation policy. If you cancel 24 hours before your appointment, you'll get a full refund. For cancellations within 24 hours, a small processing fee applies. Your satisfaction is our priority!", lang: "en-US" };
        }

        // ========== OPERATING INFORMATION ==========

        if (lowerQuery.includes("open") || lowerQuery.includes("hours") || lowerQuery.includes("timing") || lowerQuery.includes("when") || lowerQuery.includes("schedule")) {
            return { text: "We're open Monday to Friday 9 AM to 7 PM, Saturday 9 AM to 6 PM, and Sunday 10 AM to 5 PM. We're closed on public holidays. Would you like to book an appointment?", lang: "en-US" };
        }

        if (lowerQuery.includes("location") || lowerQuery.includes("address") || lowerQuery.includes("where") || lowerQuery.includes("directions")) {
            setTimeout(() => router.push("/contact"), 1000);
            return { text: "We're located at 123 Car Care Street, Auto District, Tirupur. I'll open the contact page with our exact location and Google Maps directions.", lang: "en-US" };
        }

        if (lowerQuery.includes("whatsapp") || lowerQuery.includes("message") || lowerQuery.includes("chat")) {
            return { text: "You can reach us on WhatsApp at +91 98765 43210. Just send us a message and we'll respond quickly! You can also use the WhatsApp button on our website.", lang: "en-US" };
        }

        // ========== SUPPORT & FEEDBACK ==========

        // ========== SUPPORT & FEEDBACK INTEGRATION ==========

        // Open Feedback Form
        if (lowerQuery.includes("feedback") || lowerQuery.includes("suggest") || lowerQuery.includes("complaint") || lowerQuery.includes("improve")) {
            setTimeout(() => setActiveView("feedback"), 800);
            return {
                text: activeLang === "ta-IN"
                    ? "நிச்சயமாக! உங்கள் கருத்துக்களைப் பகிர கருத்துப் படிவத்தைத் திறக்கிறேன்."
                    : activeLang === "hi-IN"
                        ? "ज़रूर! मैं आपके विचार साझा करने के लिए फीडबैक फॉर्म खोल रहा हूँ।"
                        : "Sure! I'm opening the feedback form. We'd love to hear your thoughts.",
                lang: activeLang
            };
        }

        // Open Support Form
        if (lowerQuery.includes("support") || lowerQuery.includes("help") || lowerQuery.includes("issue") || (matchesCategory(query, "help", activeLang))) {
            // If user specifically asks to "open support ticket" or "contact support"
            if (lowerQuery.includes("open") || lowerQuery.includes("ticket") || lowerQuery.includes("contact") || lowerQuery.includes("form")) {
                setTimeout(() => setActiveView("support"), 800);
                return {
                    text: activeLang === "ta-IN"
                        ? "நிச்சயமாக, ஆதரவு கோரிக்கை படிவத்தைத் திறக்கிறேன்."
                        : activeLang === "hi-IN"
                            ? "ज़रूर, मैं सहायता अनुरोध फ़ॉर्म खोल रहा हूँ।"
                            : "Certainly, I'm opening the support request form for you.",
                    lang: activeLang
                };
            }
            // Otherwise give generic help text usually, but for now let's be smart
            if (lowerQuery.includes("support")) {
                setTimeout(() => setActiveView("support"), 1500);
                return {
                    text: languageResponses[activeLang].supportResponse + (activeLang === "en-US" ? " I'll open the support form for you." : ""),
                    lang: activeLang
                };
            }
        }

        // ========== CAR CARE ADVICE ==========

        if (lowerQuery.includes("maintain") || lowerQuery.includes("care for") || lowerQuery.includes("protect my car")) {
            return { text: "Regular maintenance is key! We recommend washing every 2 weeks, waxing every 3 months, and ceramic coating every 2-3 years for best protection. Interior should be detailed every 6 months.", lang: "en-US" };
        }

        if (lowerQuery.includes("wash") && (lowerQuery.includes("how often") || lowerQuery.includes("frequency"))) {
            return { text: "For optimal care, wash your car every 1-2 weeks, especially if you drive in dusty conditions or park outdoors. Regular washing prevents dirt buildup and paint damage.", lang: "en-US" };
        }

        // ========== SPECIFIC SERVICE QUERIES ==========

        if (lowerQuery.includes("polish") || lowerQuery.includes("buffing")) {
            return { text: "Our polishing service removes minor scratches, swirl marks, and oxidation to restore your paint's shine. We use professional-grade compounds and machines for a perfect finish!", lang: "en-US" };
        }

        if (lowerQuery.includes("wax") || lowerQuery.includes("sealant")) {
            return { text: "Waxing provides a protective layer and deep shine. We use premium carnauba wax that lasts 2-3 months. For longer protection, consider our ceramic coating!", lang: "en-US" };
        }

        if (lowerQuery.includes("engine") && lowerQuery.includes("clean")) {
            return { text: "Engine bay detailing removes dirt, grease, and grime, making your engine look new and helping with maintenance inspections. It's safe for all modern engines with proper waterproofing.", lang: "en-US" };
        }

        if (lowerQuery.includes("odor") || lowerQuery.includes("smell") || lowerQuery.includes("ac clean")) {
            return { text: "We offer odor removal and AC sanitization! Using ozone treatment and enzymatic cleaners, we eliminate bad smells from smoke, pets, food, and mold. Your cabin will smell fresh again!", lang: "en-US" };
        }

        // ========== VEHICLE TYPE QUESTIONS ==========

        if (lowerQuery.includes("luxury car") || lowerQuery.includes("premium car") || lowerQuery.includes("bmw") || lowerQuery.includes("mercedes") || lowerQuery.includes("audi")) {
            return { text: "We specialize in luxury and premium vehicles! Our technicians are trained in handling high-end cars with extra care, using premium products specifically designed for luxury vehicles.", lang: "en-US" };
        }

        if (lowerQuery.includes("bike") || lowerQuery.includes("motorcycle") || lowerQuery.includes("two wheeler")) {
            return { text: "Yes, we service bikes and motorcycles too! We offer bike detailing, ceramic coating for bikes, and protection packages. Your two-wheeler deserves premium care too!", lang: "en-US" };
        }

        if (lowerQuery.includes("suv") || lowerQuery.includes("large vehicle")) {
            return { text: "We handle all vehicle sizes including SUVs, MUVs, and large vehicles. Pricing varies based on vehicle size, and we ensure thorough cleaning even for the biggest vehicles!", lang: "en-US" };
        }

        // ========== BOOKING PROCESS ==========

        if (lowerQuery.includes("how to book") || lowerQuery.includes("booking process")) {
            setTimeout(() => router.push("/booking"), 1000);
            return { text: "Booking is easy! Just select your service, choose your vehicle type, pick a date and time slot, and confirm. You'll get instant confirmation and can track your booking in real-time!", lang: "en-US" };
        }

        if (lowerQuery.includes("reschedule") || lowerQuery.includes("change appointment")) {
            return { text: "You can reschedule your booking anytime from your dashboard. Just go to 'My Bookings', select the booking, and choose a new time slot. No charges for rescheduling!", lang: "en-US" };
        }

        if (lowerQuery.includes("same day") || lowerQuery.includes("emergency") || lowerQuery.includes("urgent")) {
            return { text: "We try to accommodate same-day bookings based on availability! Check our booking page for available slots today, or call us directly for urgent requests.", lang: "en-US" };
        }

        // ========== QUALITY & GUARANTEE ==========

        if (lowerQuery.includes("guarantee") || lowerQuery.includes("warranty") || lowerQuery.includes("quality")) {
            return { text: "We stand behind our work with a satisfaction guarantee! If you're not happy with any service, we'll redo it free of charge. Some services like ceramic coating come with multi-year warranties.", lang: "en-US" };
        }

        if (lowerQuery.includes("certified") || lowerQuery.includes("trained") || lowerQuery.includes("professional")) {
            return { text: "All our technicians are certified professionals with years of experience. We use only premium, branded products and follow international detailing standards for the best results.", lang: "en-US" };
        }

        // ========== TECHNOLOGY & AI ==========

        if (lowerQuery.includes("ai") || lowerQuery.includes("technology") || lowerQuery.includes("shashti ai")) {
            return { text: "We use AI-powered systems for service recommendations, real-time tracking, and smart scheduling. However, I'm Dinesh, your voice assistant - separate from Shashti AI. I help you navigate and find information!", lang: "en-US" };
        }

        if (lowerQuery.includes("tracking") || lowerQuery.includes("live status") || lowerQuery.includes("progress")) {
            return { text: "Yes! We have live service tracking. Once your service starts, you can see real-time progress with photos at each stage. It's like tracking a food delivery, but for your car!", lang: "en-US" };
        }

        // ========== GENERAL HELP ==========

        if (lowerQuery.includes("what can you do") || lowerQuery.includes("capabilities") || lowerQuery.includes("features")) {
            return { text: "I can help you navigate the website, book services, answer questions about our services, explain pricing, share our hours and location, help with support requests, collect feedback, and much more! Just ask me anything about Shashti Karz.", lang: "en-US" };
        }

        if (lowerQuery.includes("who are you") || lowerQuery.includes("your name")) {
            return { text: "I'm Dinesh, your friendly voice assistant for Shashti Karz! I'm here to help you navigate our services, answer questions, and make your car care experience smooth and easy. I can understand voice commands or you can type to me!", lang: "en-US" };
        }

        if (lowerQuery.includes("thank") || lowerQuery.includes("thanks")) {
            return { text: "You're very welcome! I'm always here to help. Is there anything else you'd like to know about our services?", lang: "en-US" };
        }

        // ========== DEFAULT RESPONSES ==========

        // If query seems like a question
        if (lowerQuery.includes("?") || lowerQuery.includes("what") || lowerQuery.includes("how") || lowerQuery.includes("when") || lowerQuery.includes("where") || lowerQuery.includes("why")) {
            return { text: "I'd love to help answer your question! Could you please be more specific? You can ask me about our services, pricing, location, hours, booking process, or anything else about Shashti Karz.", lang: "en-US" };
        }

        // Generic greeting
        if (lowerQuery.includes("hi") || lowerQuery.includes("hello") || lowerQuery.includes("hey")) {
            return { text: "Hello! How can I assist you today? You can ask me about our services, book an appointment, track your order, check pricing, or get support.", lang: "en-US" };
        }

        // Default response
        return { text: languageResponses[activeLang].defaultResponse || languageResponses["en-US"].defaultResponse, lang: activeLang };
    };

    const logInteraction = async (query: string, reply: string) => {
        try {
            const supabase = createClient();

            // Detect intent
            const lowerQuery = query.toLowerCase();
            let interactionType: "navigation" | "service_query" | "booking" | "support" | "feedback" | "general" = "general";

            if (lowerQuery.includes("book") || lowerQuery.includes("appointment")) {
                interactionType = "booking";
            } else if (lowerQuery.includes("support") || lowerQuery.includes("help") || lowerQuery.includes("issue")) {
                interactionType = "support";
            } else if (lowerQuery.includes("feedback") || lowerQuery.includes("suggest")) {
                interactionType = "feedback";
            } else if (lowerQuery.includes("service") || lowerQuery.includes("price") || lowerQuery.includes("cost")) {
                interactionType = "service_query";
            } else if (lowerQuery.includes("home") || lowerQuery.includes("page") || lowerQuery.includes("open")) {
                interactionType = "navigation";
            }

            await supabase.from("dinesh_interactions").insert({
                session_id: sessionId,
                user_id: userId || null,
                interaction_type: interactionType,
                user_query: query,
                assistant_response: reply,
                intent_detected: interactionType,
                confidence_score: 0.85,
                metadata: {
                    pathname,
                    userName: userName || "Guest"
                }
            });
        } catch (error) {
            console.error("Error logging interaction:", error);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 left-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-500/50 transition-all hover:scale-110 animate-pulse-slow group"
                    title="Dinesh Voice Assistant"
                >
                    <HeadphonesIcon size={28} className="text-white" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>

                    {/* Tooltip */}
                    <span className="absolute left-full ml-4 px-4 py-2 rounded-lg bg-black/90 text-white text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        👋 Hi! I'm Dinesh
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 left-6 z-50 w-[400px] h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/30">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {activeView !== "chat" ? (
                                <button
                                    onClick={() => setActiveView("chat")}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <ArrowLeft size={24} className="text-white" />
                                </button>
                            ) : (
                                <div className="relative">
                                    <HeadphonesIcon size={24} className="text-white" />
                                    {isSpeaking && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                                    )}
                                </div>
                            )}

                            <div>
                                <h3 className="text-white font-bold text-lg">
                                    {activeView === "feedback" ? "Feedback" : activeView === "support" ? "Support" : "Dinesh"}
                                </h3>
                                <p className="text-purple-100 text-xs">
                                    {activeView !== "chat" ? "We're here to help" : "Your Voice Assistant"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`text-white hover:bg-white/20 p-2 rounded-lg transition-colors ${showSettings ? 'bg-white/20' : ''}`}
                                title="Voice Settings"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowSettings(false);
                                    stopSpeaking();
                                    recognitionRef.current?.stop();
                                }}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="bg-slate-800 border-b border-purple-500/30 p-4 space-y-4 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium flex items-center gap-2">
                                    <User size={16} className="text-purple-400" />
                                    Voice Persona
                                </span>
                                <div className="flex bg-slate-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setSettings({ ...settings, voiceGender: "male" })}
                                        className={`px-3 py-1 rounded-md text-xs transition-all ${settings.voiceGender === "male" ? "bg-purple-600 text-white" : "text-slate-400"}`}
                                    >
                                        Dinesh
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, voiceGender: "female" })}
                                        className={`px-3 py-1 rounded-md text-xs transition-all ${settings.voiceGender === "female" ? "bg-purple-600 text-white" : "text-slate-400"}`}
                                    >
                                        Deepika
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium flex items-center gap-2">
                                    <Languages size={16} className="text-purple-400" />
                                    Language
                                </span>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                                    className="bg-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none border border-white/10"
                                >
                                    <option value="en-US">English</option>
                                    <option value="ta-IN">Tamil (தமிழ்)</option>
                                    <option value="hi-IN">Hindi (हिंदी)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-2"><Sliders size={14} /> Speech Rate</span>
                                    <span>{settings.speechRate}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={settings.speechRate}
                                    onChange={(e) => setSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium">Sound Effects</span>
                                <button
                                    onClick={() => setSettings({ ...settings, soundEffectsEnabled: !settings.soundEffectsEnabled })}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.soundEffectsEnabled ? "bg-green-500" : "bg-slate-600"}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${settings.soundEffectsEnabled ? "translate-x-5" : ""}`}></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeView === "chat" ? (
                            <>
                                {conversation.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl p-3 ${msg.role === "user"
                                                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                                                : "bg-slate-800/80 text-white border border-purple-500/30"
                                                }`}
                                        >
                                            <p className="text-sm">{msg.message}</p>
                                            <p className="text-xs opacity-60 mt-1">
                                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isListening && transcript && (
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] rounded-2xl p-3 bg-purple-500/30 text-white border border-purple-500/50">
                                            <p className="text-sm italic">{transcript}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : activeView === "feedback" ? (
                            <div className="animate-in slide-in-from-right duration-300">
                                <CustomerFeedbackForm
                                    userName={userName}
                                    onSuccess={() => {
                                        toast.success("Feedback submitted!");
                                        setTimeout(() => setActiveView("chat"), 2000);
                                        addMessage("assistant", "Thank you for your feedback! It helps us improve.");
                                        speak("Thank you for your feedback!");
                                    }}
                                />
                            </div>
                        ) : activeView === "support" ? (
                            <div className="animate-in slide-in-from-right duration-300">
                                <SupportRequestForm
                                    userName={userName}
                                    onSuccess={() => {
                                        toast.success("Support request submitted!");
                                        setTimeout(() => setActiveView("chat"), 2000);
                                        addMessage("assistant", "Support request submitted. We will contact you soon.");
                                        speak("Support request submitted successfully.");
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Status Bar */}
                    {activeView === "chat" && (isListening || isSpeaking) && (
                        <div className="px-4 py-2 bg-slate-800/50 border-t border-purple-500/30">
                            <div className="flex items-center gap-2">
                                {isListening && (
                                    <>
                                        <div className="flex gap-1">
                                            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse"></span>
                                            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-75"></span>
                                            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-150"></span>
                                        </div>
                                        <span className="text-red-400 text-xs font-semibold">Listening...</span>
                                    </>
                                )}
                                {isSpeaking && (
                                    <>
                                        <Volume2 size={16} className="text-green-400 animate-pulse" />
                                        <span className="text-green-400 text-xs font-semibold">Speaking...</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    {activeView === "chat" && (
                        <div className="p-4 bg-slate-800/50 border-t border-purple-500/30">
                            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-slate-700/50 text-white placeholder-slate-400 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!textInput.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white p-2 rounded-xl transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-3 rounded-xl transition-all ${isListening
                                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                        } text-white`}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                            </form>
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                Click the mic to speak or type your question
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
