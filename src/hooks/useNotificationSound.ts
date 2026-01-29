import { useCallback } from 'react';

type SoundType = 'success' | 'warning' | 'info' | 'error' | 'alert' | 'notification';

const SOUND_ENABLED_KEY = 'admin_sounds_enabled';

export function useNotificationSound() {
    const isSoundEnabled = () => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem(SOUND_ENABLED_KEY);
        return stored === null || stored === 'true';
    };

    const playSound = useCallback((type: SoundType = 'notification') => {
        if (!isSoundEnabled()) return;

        try {
            // Use Web Audio API for better control
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different notification types
            const frequencies: Record<SoundType, number> = {
                success: 800,
                warning: 600,
                info: 500,
                error: 400,
                alert: 900,
                notification: 700
            };

            oscillator.frequency.value = frequencies[type];
            oscillator.type = 'sine';

            // Envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

        } catch (error) {
            console.error('Failed to play notification sound:', error);
        }
    }, []);

    const toggleSound = useCallback(() => {
        const current = isSoundEnabled();
        localStorage.setItem(SOUND_ENABLED_KEY, (!current).toString());
        return !current;
    }, []);

    return {
        playSound,
        toggleSound,
        isSoundEnabled: isSoundEnabled()
    };
}
