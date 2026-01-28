
"use client";

import { useEffect, useRef } from "react";
import { Howl } from "howler";

interface AmbientSoundProps {
    isMuted: boolean;
    sceneId: string;
}

const SOUNDS: Record<string, string> = {
    outside: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Temporary placeholder
    workshop: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    service_bay: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
};

export default function AmbientSound({ isMuted, sceneId }: AmbientSoundProps) {
    const soundRef = useRef<Howl | null>(null);

    useEffect(() => {
        // Stop previous sound
        if (soundRef.current) {
            soundRef.current.fade(soundRef.current.volume(), 0, 1000);
            const oldSound = soundRef.current;
            setTimeout(() => oldSound.stop(), 1000);
        }

        // Load and play new sound
        const soundUrl = SOUNDS[sceneId] || SOUNDS.outside;
        soundRef.current = new Howl({
            src: [soundUrl],
            loop: true,
            volume: 0,
            html5: true,
        });

        if (!isMuted) {
            soundRef.current.play();
            soundRef.current.fade(0, 0.3, 2000);
        }

        return () => {
            if (soundRef.current) {
                soundRef.current.stop();
            }
        };
    }, [sceneId]);

    useEffect(() => {
        if (soundRef.current) {
            if (isMuted) {
                soundRef.current.fade(soundRef.current.volume(), 0, 1000);
            } else {
                if (!soundRef.current.playing()) {
                    soundRef.current.play();
                }
                soundRef.current.fade(soundRef.current.volume(), 0.3, 1000);
            }
        }
    }, [isMuted]);

    return null;
}
