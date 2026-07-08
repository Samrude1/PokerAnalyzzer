import { useEffect, useState } from 'react';

interface FinalTableAnnouncementProps {
    onComplete: () => void;
}

export function FinalTableAnnouncement({ onComplete }: FinalTableAnnouncementProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Hide overlay after 3 seconds, then call onComplete
        const hideTimer = setTimeout(() => {
            setVisible(false);
            const completeTimer = setTimeout(() => {
                onComplete();
            }, 500); // Wait for fade out animation
            return () => clearTimeout(completeTimer);
        }, 3000);

        return () => clearTimeout(hideTimer);
    }, [onComplete]);

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <div className="text-center transform scale-110 transition-transform duration-1000 ease-out">
                <div className="text-8xl mb-4 animate-bounce">🏆</div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                    Final Table
                </h1>
                <p className="text-xl text-white mt-4 font-bold tracking-wider">
                    Only the best remain...
                </p>
            </div>
        </div>
    );
}
