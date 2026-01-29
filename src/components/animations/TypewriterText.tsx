"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TypewriterTextProps {
    text: string | string[];
    speed?: number;
    delay?: number;
    loop?: boolean;
    cursor?: boolean;
    cursorChar?: string;
    className?: string;
    onComplete?: () => void;
}

export function TypewriterText({
    text,
    speed = 50,
    delay = 0,
    loop = false,
    cursor = true,
    cursorChar = "|",
    className = "",
    onComplete,
}: TypewriterTextProps) {
    const [displayText, setDisplayText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [textArrayIndex, setTextArrayIndex] = useState(0);

    const textArray = Array.isArray(text) ? text : [text];
    const currentText = textArray[textArrayIndex];

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!isDeleting && currentIndex < currentText.length) {
                setDisplayText(currentText.substring(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            } else if (isDeleting && currentIndex > 0) {
                setDisplayText(currentText.substring(0, currentIndex - 1));
                setCurrentIndex(currentIndex - 1);
            } else if (!isDeleting && currentIndex === currentText.length) {
                if (loop && textArray.length > 1) {
                    setTimeout(() => setIsDeleting(true), 2000);
                } else if (onComplete) {
                    onComplete();
                }
            } else if (isDeleting && currentIndex === 0) {
                setIsDeleting(false);
                setTextArrayIndex((textArrayIndex + 1) % textArray.length);
            }
        }, isDeleting ? speed / 2 : currentIndex === 0 ? delay : speed);

        return () => clearTimeout(timeout);
    }, [currentIndex, isDeleting, currentText, textArray, textArrayIndex, speed, delay, loop, onComplete]);

    return (
        <span className={className}>
            {displayText}
            {cursor && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-block ml-1"
                >
                    {cursorChar}
                </motion.span>
            )}
        </span>
    );
}

export function TypewriterLines({
    lines,
    speed = 50,
    lineDelay = 1000,
    className = "",
}: {
    lines: string[];
    speed?: number;
    lineDelay?: number;
    className?: string;
}) {
    const [visibleLines, setVisibleLines] = useState<number>(0);

    useEffect(() => {
        if (visibleLines < lines.length) {
            const timeout = setTimeout(() => {
                setVisibleLines(visibleLines + 1);
            }, lineDelay);
            return () => clearTimeout(timeout);
        }
    }, [visibleLines, lines.length, lineDelay]);

    return (
        <div className={className}>
            <AnimatePresence>
                {lines.slice(0, visibleLines).map((line, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TypewriterText
                            text={line}
                            speed={speed}
                            cursor={index === visibleLines - 1}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export function TypewriterWord({
    words,
    speed = 100,
    className = "",
}: {
    words: string[];
    speed?: number;
    className?: string;
}) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, speed * 10);

        return () => clearInterval(interval);
    }, [words.length, speed]);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={currentWordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={className}
            >
                <TypewriterText text={words[currentWordIndex]} speed={speed} cursor={false} />
            </motion.span>
        </AnimatePresence>
    );
}
