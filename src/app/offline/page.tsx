import { WifiOff, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#ff1744]/20 blur-[100px] rounded-full" />
                <div className="relative w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                    <WifiOff size={48} className="text-[#ff1744]" />
                </div>
            </div>

            <h1 className="text-3xl font-bold font-display mb-4">You&apos;re Offline</h1>
            <p className="text-[#888] mb-8 max-w-md">
                It looks like you don&apos;t have an internet connection. Don&apos;t worry, you can still view some of your previous bookings once you&apos;re back online.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="btn-premium px-8 py-3 rounded-xl flex items-center gap-2 justify-center"
                >
                    <RefreshCcw size={18} />
                    Try Again
                </button>
                <Link
                    href="/"
                    className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 justify-center"
                >
                    <Home size={18} />
                    Go Home
                </Link>
            </div>

            <div className="mt-12 text-xs text-[#666]">
                Shashti Karz - Premium Car Detailing
            </div>
        </div>
    );
}
