
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SCENES, Scene, Hotspot as HotspotType } from "@/lib/virtual-tour/scenes";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ArrowUpRight, Play, Maximize2, MousePointer2 } from "lucide-react";

interface ViewerProps {
    currentScene: Scene;
    onNavigate: (sceneId: string) => void;
    onAction: (action: string) => void;
}

function SceneSphere({ url }: { url: string }) {
    // Force use of local proxy for all external images to bypass CORS
    const proxyUrl = url.startsWith('http')
        ? `/api/proxy-image?url=${encodeURIComponent(url)}`
        : url;

    const texture = useTexture(proxyUrl);

    return (
        <mesh scale={[-1, 1, 1]} rotation={[0, -Math.PI / 2, 0]}>
            {/* Using a 180-degree cylinder segment for 2D photos to create a natural panorama feel */}
            <cylinderGeometry args={[50, 50, 60, 60, 1, true, 0, Math.PI]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} transparent />
        </mesh>
    );
}

function Hotspot({ data, onNavigate }: { data: HotspotType, onNavigate: (id: string) => void }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Html position={new THREE.Vector3(...data.position)}>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => {
                    if (data.type === "navigation" && data.targetScene) {
                        onNavigate(data.targetScene);
                    }
                }}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border ${data.type === "navigation" ? "bg-[#ff1744]/20 border-[#ff1744]" : "bg-blue-500/20 border-blue-500"
                    } transition-all duration-300 shadow-[0_0_15px_rgba(255,23,68,0.3)]`}>
                    {data.type === "navigation" && <ArrowUpRight className="text-white" size={20} />}
                    {data.type === "info" && <Info className="text-white" size={20} />}
                    {data.type === "action" && <Play className="text-white ml-0.5" size={20} />}
                </div>

                <AnimatePresence>
                    {(hovered || data.type === "navigation") && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest pointer-events-none"
                        >
                            {data.label}
                        </motion.div>
                    )}
                </AnimatePresence>

                {hovered && data.type === "info" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl"
                    >
                        <h4 className="font-bold text-xs mb-1 text-blue-400 uppercase tracking-wider">{data.infoTitle}</h4>
                        <p className="text-[10px] text-white/70 leading-relaxed font-medium">{data.infoBody}</p>
                    </motion.div>
                )}
            </motion.div>
        </Html>
    );
}

function CameraReset({ initialRotation }: { initialRotation: [number, number, number] }) {
    const { controls } = useThree();

    useEffect(() => {
        if (controls) {
            (controls as any).setAzimuthalAngle(initialRotation[1]);
            (controls as any).setPolarAngle(Math.PI / 2);
        }
    }, [initialRotation, controls]);

    return null;
}

export default function VirtualTourViewer({ currentScene, onNavigate, onAction }: ViewerProps) {
    return (
        <div className="w-full h-screen bg-black relative">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    rotateSpeed={-0.45}
                    autoRotate={false}
                    makeDefault
                />

                <CameraReset initialRotation={currentScene.initialRotation} />

                <Suspense fallback={null}>
                    <SceneSphere key={currentScene.id} url={currentScene.image} />
                </Suspense>

                {currentScene.hotspots.map((hotspot, idx) => (
                    <Hotspot key={`${currentScene.id}-${idx}`} data={hotspot} onNavigate={onNavigate} />
                ))}
            </Canvas>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="flex flex-col items-center gap-4">
                    <MousePointer2 className="text-white animate-bounce" size={48} />
                    <p className="text-white text-sm font-bold uppercase tracking-[0.3em]">Drag to explore</p>
                </div>
            </div>
        </div>
    );
}
