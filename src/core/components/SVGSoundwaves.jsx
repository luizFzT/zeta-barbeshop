import React from 'react';

/**
 * SVGSoundwaves - Represents the "Current Service" focus.
 * Symmetrical sound waves/frequencies simulating the hum of a clipper.
 * The central bar pulses with the primary accent color.
 */
export function SVGSoundwaves({ className = "" }) {
    return (
        <svg
            className={`w-12 h-12 ${className}`}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer subtle bars */}
            <rect x="8" y="24" width="6" height="16" rx="3" className="fill-muted opacity-40 animate-pulse" style={{ animationDelay: '0ms' }} />
            <rect x="50" y="24" width="6" height="16" rx="3" className="fill-muted opacity-40 animate-pulse" style={{ animationDelay: '0ms' }} />

            {/* Mid bars */}
            <rect x="22" y="16" width="6" height="32" rx="3" className="fill-muted opacity-70 animate-pulse" style={{ animationDelay: '200ms' }} />
            <rect x="36" y="16" width="6" height="32" rx="3" className="fill-muted opacity-70 animate-pulse" style={{ animationDelay: '200ms' }} />

            {/* Center active bar */}
            <rect x="29" y="8" width="6" height="48" rx="3" className="fill-accent animate-pulse" style={{ animationDuration: '1.5s', filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' }} />
        </svg>
    );
}
