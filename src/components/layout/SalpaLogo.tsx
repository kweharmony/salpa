"use client";

import { cn } from "@/lib/utils";

interface SalpaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "monogram" | "convertFile" | "convert" | "drop" | "classic";
}

export function SalpaLogo({ className, size = "md", showText = true, variant = "monogram" }: SalpaLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Salpa Icon */}
      {variant === "monogram" ? (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-primary"
        >
          {/* Outer circle */}
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Stylized 'S' path */}
          <path
            d="M22 11c0-2.2-2.4-3.6-6-3.6s-6 1.4-6 3.4c0 2.2 2.8 3 6 3.8s6 1.6 6 3.8c0 2.4-2.6 4.2-6 4.2s-6-1.6-6-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : variant === "convertFile" ? (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-primary"
        >
          {/* File with folded corner */}
          <rect x="9" y="5" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M18 5L23 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 5v5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

          {/* Right arrow indicating conversion/export */}
          <path d="M6 16h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 13l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : variant === "convert" ? (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-primary"
        >
          {/* Circular arrows representing conversion */}
          <path
            d="M16 5a11 11 0 0 1 9.5 5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M26 10.4v-3.8M26 10.4h-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 27a11 11 0 0 1-9.5-5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 21.6v3.8M6 21.6h3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : variant === "drop" ? (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-primary"
        >
          {/* Water drop silhouette */}
          <path
            d="M16 3C12.5 6.5 10 11 10 16c0 5 3.5 9 6 10 2.5-1 6-5 6-10 0-5-2.5-9.5-6-13z"
            fill="currentColor"
          />
          {/* Inner highlight */}
          <path
            d="M18 9c-2 2.2-3 4.6-3 7.2 0 3.2 1.6 5.6 3 6.8"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.65"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Classic ellipse creature */}
          <ellipse cx="16" cy="16" rx="12" ry="8" fill="#0A7EA4" />
          <ellipse cx="16" cy="16" rx="9" ry="5" fill="#66C2E0" opacity="0.6" />
          <path d="M8 16C8 13.5 11.5 11 16 11C20.5 11 24 13.5 24 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M8 16C8 18.5 11.5 21 16 21C20.5 21 24 18.5 24 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="6" cy="16" r="2" fill="#66C2E0" />
          <circle cx="26" cy="16" r="2" fill="#66C2E0" />
        </svg>
      )}
      {showText && (
        <span className={cn("font-bold text-primary", text)}>
          Salpa
        </span>
      )}
    </div>
  );
}
