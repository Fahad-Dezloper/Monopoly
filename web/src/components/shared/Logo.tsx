"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  href?: string | null;
  className?: string;
  showGame?: boolean;
  badge?: boolean;
}

const MARK_HEIGHT: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
};

const WORD_SIZE: Record<LogoSize, string> = {
  sm: "text-[12px]",
  md: "text-[13px]",
  lg: "text-[15px]",
};

export function Logo({
  size = "md",
  href = "/",
  className = "",
  showGame = true,
  badge = false,
}: LogoProps) {
  const inner = badge ? (
    <img
      src={BRAND.logo}
      alt={BRAND.name}
      className={`h-11 w-auto object-contain drop-shadow-sm ${className}`.trim()}
    />
  ) : (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <img
        src={BRAND.logo}
        alt=""
        aria-hidden
        className={`${MARK_HEIGHT[size]} w-auto object-contain`}
      />
      <span className="flex flex-col gap-px leading-[1.1]">
        <span
          className={`font-extrabold tracking-[0.02em] text-slate-900 uppercase ${WORD_SIZE[size]}`}
        >
          {BRAND.name}
        </span>
        {showGame && (
          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#7c3aed] uppercase">
            {BRAND.tagline}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex text-inherit no-underline"
        aria-label={`${BRAND.name} home`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
