"use client";

export function BetterAuthShieldLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 2L4 8V16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16V8L16 2Z" fill="#397A4A"></path>
      <path
        d="M12 16L15 19L20 13"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

