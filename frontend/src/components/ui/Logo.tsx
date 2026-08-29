import React from "react";

export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark background squircle */}
      <rect width="36" height="36" rx="9" fill="#0b0f19" />
      
      {/* Subtle border */}
      <rect
        x="0.5"
        y="0.5"
        width="35"
        height="35"
        rx="8.5"
        stroke="#1e293b"
        strokeWidth="1"
      />

      {/* Left white chevron '>' shape */}
      <path
        d="M10.5 11.5L16.5 18L10.5 24.5H15L20 18L15 11.5H10.5Z"
        fill="#FFFFFF"
      />

      {/* Right blue hourglass / chevron shape */}
      <path
        d="M20 11.5L25.5 18L20 24.5H24.5L28.5 18L24.5 11.5H20Z"
        fill="#60A5FA"
        fillOpacity="0.85"
      />
    </svg>
  );
}
