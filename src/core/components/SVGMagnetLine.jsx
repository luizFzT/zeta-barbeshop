import React from 'react';

/**
 * SVGMagnetLine - Represents the "Add to Queue / Organize Chaos" focus.
 * Points (chaos) being pulled directly into a perfect organized line.
 */
export function SVGMagnetLine({ className = "" }) {
    return (
        <svg
            className={`w-full max-w-full ${className}`}
            viewBox="0 0 300 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            {/* Background organizing lines */}
            <line x1="0" y1="30" x2="300" y2="30" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="45" x2="300" y2="45" stroke="var(--border)" strokeWidth="1" opacity="0.3" />

            {/* Scattered "chaos" points (originating from outside) */}
            <circle cx="20" cy="15" r="2" className="fill-muted opacity-40" />
            <circle cx="60" cy="10" r="3" className="fill-muted opacity-50" />
            <circle cx="110" cy="20" r="2.5" className="fill-muted opacity-60" />

            {/* Lines illustrating the "pull" into the main track */}
            <path d="M 60 10 Q 75 30 150 30" stroke="var(--text-muted)" strokeWidth="1" fill="none" opacity="0.4" />
            <path d="M 110 20 Q 120 30 180 30" stroke="var(--text-muted)" strokeWidth="1" fill="none" opacity="0.4" />

            {/* The organized queue / active glowing segments on the perfect line */}
            <rect x="150" y="28" width="8" height="4" rx="2" className="fill-accent" style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))' }} />
            <rect x="180" y="28" width="16" height="4" rx="2" className="fill-accent" style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.8))' }} />
            <rect x="220" y="28" width="12" height="4" rx="2" className="fill-accent opacity-70" />

            {/* Pulsing origin/destination points on the grid */}
            <circle cx="280" cy="30" r="4" className="fill-accent animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' }} />
        </svg>
    );
}
