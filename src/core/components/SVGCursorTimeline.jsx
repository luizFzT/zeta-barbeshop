import React from 'react';

/**
 * SVGCursorTimeline - Represents the "Your Turn / Wait Time" focus.
 * A ruler/timeline mapping the progression of the queue.
 */
export function SVGCursorTimeline({ queueLength = 0, position = 0, className = "" }) {
    // We draw a curved path.
    // Circles for people waiting.
    // A glowing triangle for the current position.

    const totalSlots = Math.max(queueLength, 5); // ensure some length
    const progressRatio = queueLength === 0 ? 0 : 1 - (position / totalSlots);

    // Curved path from (10, 50) to (190, 50) arching to y=20
    const pathData = "M 10 50 Q 100 0 190 50";

    return (
        <svg
            className={`w-full max-w-xs mx-auto ${className}`}
            viewBox="0 0 200 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background Track */}
            <path
                d={pathData}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-muted opacity-30"
            />

            {/* Active Track (filled up to progress) */}
            <path
                d={pathData}
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="200"
                strokeDashoffset={200 - (200 * progressRatio)}
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.4))' }}
            />

            {/* Origin/End Points */}
            <circle cx="10" cy="50" r="4" className="fill-muted opacity-50" />
            <circle cx="190" cy="50" r="6" className="fill-accent animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' }} />

            {/* Position Marker */}
            <g
                className="transition-all duration-1000 ease-out"
                style={{
                    transform: `translateX(${progressRatio * 180}px) translateY(${Math.sin(progressRatio * Math.PI) * -30}px)`
                }}
            >
                <polygon
                    points="6,45 14,45 10,53"
                    className="fill-accent"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' }}
                />
            </g>
        </svg>
    );
}
