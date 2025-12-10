"use client";

import { cn } from "@/lib/utils";

interface SalpaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function SalpaLogo({ className, size = "md", showText = true }: SalpaLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Salpa Icon - stylized marine creature */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Body - barrel shape */}
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="8"
          fill="#0A7EA4"
          className="transition-colors duration-150"
        />
        {/* Inner transparency effect */}
        <ellipse
          cx="16"
          cy="16"
          rx="9"
          ry="5"
          fill="#66C2E0"
          opacity="0.6"
        />
        {/* Bands/rings */}
        <path
          d="M8 16C8 13.5 11.5 11 16 11C20.5 11 24 13.5 24 16"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M8 16C8 18.5 11.5 21 16 21C20.5 21 24 18.5 24 16"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Siphon openings */}
        <circle cx="6" cy="16" r="2" fill="#66C2E0" />
        <circle cx="26" cy="16" r="2" fill="#66C2E0" />
        {/* Water flow arrows */}
        <path
          d="M2 16L4 14.5M2 16L4 17.5"
          stroke="#0A7EA4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M30 16L28 14.5M30 16L28 17.5"
          stroke="#0A7EA4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={cn("font-bold text-primary", text)}>
          Salpa
        </span>
      )}
    </div>
  );
}
