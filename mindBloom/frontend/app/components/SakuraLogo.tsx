export interface SakuraLogoProps {
  className?: string;
  colorClass?: string;
}

export default function SakuraLogo({ className = "w-8 h-8", colorClass = "text-purple-600" }: SakuraLogoProps) {
  return (
    <svg className={`${className} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-label="Mind Bloom - Sakura Logo">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2 Q14 6 12 10 Q10 6 12 2" opacity="0.9" />
      <path d="M22 12 Q18 14 14 12 Q18 10 22 12" opacity="0.9" />
      <path d="M12 22 Q10 18 12 14 Q14 18 12 22" opacity="0.9" />
      <path d="M2 12 Q6 10 10 12 Q6 14 2 12" opacity="0.9" />
    </svg>
  );
}
