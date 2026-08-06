"use client";

import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  href?: string | null;
  className?: string;
  showGame?: boolean;
  badge?: boolean;
}

const MARK_SIZE: Record<LogoSize, string> = {
  sm: "size-[34px]",
  md: "size-[42px]",
  lg: "size-[56px]",
};

const BRAND_SIZE: Record<LogoSize, string> = {
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
    <span
      className={`inline-flex min-w-[88px] flex-col items-center justify-center rounded-[4px] bg-[#c8102e] px-2.5 py-2 leading-none ${className}`.trim()}
    >
      <span className="font-display text-[14px] tracking-[0.04em] text-white uppercase">
        Robinverse
      </span>
      <span className="mt-0.5 text-[8px] font-bold tracking-[0.16em] text-white/85 uppercase">
        Classic
      </span>
    </span>
  ) : (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <span
        className={`relative grid shrink-0 place-items-center overflow-hidden rounded-chip border border-line bg-[#111] ${MARK_SIZE[size]}`}
        aria-hidden
      >
        <img
          src="/brand/robinverse-mascot.png"
          alt=""
          className="relative z-10 size-full object-contain"
          width={128}
          height={128}
        />
      </span>
      <span className="flex flex-col gap-px leading-[1.1]">
        <span
          className={`font-extrabold tracking-[0.02em] text-body uppercase ${BRAND_SIZE[size]}`}
        >
          Robinverse
        </span>
        {showGame && (
          <span className="text-[10px] font-semibold tracking-[0.08em] text-dim uppercase">
            Monopoly
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
        aria-label="Robinverse Monopoly home"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
