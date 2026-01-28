
"use client";

import { useState, useEffect } from "react";
import VirtualTourViewer from "@/components/virtual-tour/Viewer";
import AmbientSound from "@/components/virtual-tour/AmbientSound";
import { SCENES, Scene } from "@/lib/virtual-tour/scenes";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Brain, Volume2, VolumeX,
    Map, MessageSquare, Maximize2, Minimize2,
    X, Phone, MessageCircle, Navigation,
    Shield, Award, Users
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function VirtualTourPage() {
    const [currentSceneId, setCurrentSceneId] = useState("outside");
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showAIChat, setShowAIChat] = useState(true);
    const [aiMessage, setAiMessage] = useState("");
    const [isAiTyping, setIsAiTyping] = useState(false);

    const currentScene = SCENES[currentSceneId];

    useEffect(() => {
        // Initial welcome message
        triggerAiGuide(`Welcome to our 360° Virtual Experience. ${currentScene.description}`);
    }, [currentSceneId]);

    const triggerAiGuide = (text: string) => {
        setIsAiTyping(true);
        setAiMessage("");
        let i = 0;
        const interval = setInterval(() => {
            setAiMessage((prev) => prev + text.charAt(i));
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                setIsAiTyping(false);
            }
        }, 30);
    };

    const handleNavigate = (sceneId: string) => {
        setCurrentSceneId(sceneId);
        toast.success(`Entering ${SCENES[sceneId].name}`, {
            icon: <Navigation size={16} className="text-[#ff1744]" />,
            style: { background: "#111", color: "#fff", border: "1px solid #ff1744" }
        });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
            {/* 360 Viewer */}
            <VirtualTourViewer
                currentScene={currentScene}
                onNavigate={handleNavigate}
                onAction={(action) => console.log(action)}
            />

            <AmbientSound isMuted={isMuted} sceneId={currentSceneId} />

            {/* TOP NAVIGATION HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto">
                    <Link href="/" className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl group hover:border-[#ff1744] transition-all duration-500 shadow-2xl">
                        <ArrowLeft size={18} className="text-white group-hover:-translate-x-1 transition-transform" />
                        <div>
                            <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest leading-none mb-1">Back to</p>
                            <p className="text-sm font-black text-white italic tracking-tighter">SHASHTI KARZ</p>
                        </div>
                    </Link>
                </motion.div>

                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-3 rounded-full flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <div className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" />
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">{currentScene.name}</h2>
                    </div>
                </motion.div>

                <div className="flex gap-3 pointer-events-auto">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                        {isMuted ? <VolumeX className="text-[#888]" size={20} /> : <Volume2 className="text-white" size={20} />}
                    </button>
                    <button onClick={toggleFullscreen} className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                        {isFullscreen ? <Minimize2 className="text-white" size={20} /> : <Maximize2 className="text-white" size={20} />}
                    </button>
                </div>
            </div>

            {/* AI ASSISTANT GUIDE */}
            <AnimatePresence>
                {showAIChat && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-8 lg:w-96 z-50 pointer-events-auto"
                    >
                        <div className="glass-card rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl overflow-hidden backdrop-blur-3xl">
                            <div className="bg-gradient-to-r from-[#ff1744] to-[#d4af37] p-1 shadow-lg" />
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff1744] to-[#d4af37] rounded-2xl flex items-center justify-center shadow-lg">
                                        <Brain size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold leading-none mb-1">Shashti AI Guide</h3>
                                        <p className="text-[10px] text-[#ff1744] font-black uppercase tracking-widest animate-pulse">Context Aware</p>
                                    </div>
                                    <button onClick={() => setShowAIChat(false)} className="ml-auto p-2 text-[#666] hover:text-white transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="min-h-[60px] max-h-[120px] overflow-y-auto custom-scrollbar">
                                    <p className="text-sm text-white/80 leading-relaxed font-medium">
                                        {aiMessage}
                                        {isAiTyping && <span className="inline-block w-1 h-4 bg-[#ff1744] ml-1 animate-pulse" />}
                                    </p>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 bg-white/5 border border-white/10 hover:border-[#ff1744]/50 py-3 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all">Explore Tech</button>
                                    <button className="flex-1 bg-white/5 border border-white/10 hover:border-[#ff1744]/50 py-3 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all">Book Visit</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QUICK ACTIONS SIDEBAR */}
            <div className="absolute left-8 bottom-8 flex flex-col gap-3 z-50">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                    <button onClick={() => setShowMap(!showMap)} className="w-14 h-14 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center group hover:bg-[#ff1744] transition-all duration-500 shadow-2xl">
                        <Map className="text-white group-hover:scale-110 transition-transform" />
                    </button>
                </motion.div>
                {!showAIChat && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <button onClick={() => setShowAIChat(true)} className="w-14 h-14 bg-gradient-to-br from-[#ff1744] to-[#d4af37] rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                            <Brain className="text-white" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* MAP OVERLAY */}
            <AnimatePresence>
                {showMap && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl"
                        onClick={() => setShowMap(false)}
                    >
                        <div className="w-full max-w-4xl glass-card rounded-[3rem] p-12 border border-white/10 flex flex-col items-center gap-8" onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <h2 className="text-4xl font-black italic text-[#ff1744] tracking-tighter mb-2">TOUR DIRECTORY</h2>
                                <p className="text-sm text-[#888] font-bold uppercase tracking-[0.4em]">Select Area to Teleport</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                {Object.values(SCENES).map((scene) => (
                                    <button
                                        key={scene.id}
                                        onClick={() => { handleNavigate(scene.id); setShowMap(false); }}
                                        className={`group relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-500 ${currentSceneId === scene.id ? "border-[#ff1744] scale-95" : "border-white/5 grayscale hover:grayscale-0 hover:border-white/20"
                                            }`}
                                    >
                                        <img src={scene.image} alt={scene.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-120 transition-transform duration-[2s]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                        <div className="absolute bottom-6 left-6 text-left">
                                            <p className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest mb-1">Area {scene.id}</p>
                                            <h4 className="text-sm font-bold text-white">{scene.name}</h4>
                                        </div>
                                        {currentSceneId === scene.id && (
                                            <div className="absolute top-6 right-6 px-3 py-1 bg-[#ff1744] text-[8px] font-black text-white rounded-full uppercase tracking-widest">You are here</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowMap(false)} className="px-10 py-4 border border-white/10 rounded-full text-xs font-bold text-[#888] uppercase tracking-[0.3em] hover:text-white hover:border-white transition-all">Close Directory</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LUXURY SCENE LOADING BAR */}
            <AnimatePresence>
                {!currentScene && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 bg-black z-[200] flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-white/5 border-t-[#ff1744] rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Calibrating 360° Data</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
