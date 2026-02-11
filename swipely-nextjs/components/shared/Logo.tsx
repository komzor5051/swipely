import Link from "next/link";

export function Logo({
  size = "default",
  linkTo = "/",
}: {
  size?: "small" | "default" | "large";
  linkTo?: string;
}) {
  const sizes = {
    small: { icon: 32, text: "text-lg" },
    default: { icon: 40, text: "text-xl" },
    large: { icon: 48, text: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <Link href={linkTo} className="flex items-center gap-3 no-underline">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          width: s.icon,
          height: s.icon,
          boxShadow: "0 4px 20px rgba(10, 132, 255, 0.3)",
        }}
      >
        <svg viewBox="0 0 32 32" fill="none" width={s.icon} height={s.icon}>
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#0066CC" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
          <path
            d="M10 12h12M10 16h12M10 20h8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`${s.text} font-bold tracking-tight text-foreground`}>
        Swipely
      </span>
    </Link>
  );
}
