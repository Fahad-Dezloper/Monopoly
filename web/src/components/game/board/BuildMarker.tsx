"use client";

import type { Square } from "@/lib/monopoly/types";

const HOUSE_SRC = "/brand/icons/house.svg";
const HOTEL_SRC = "/brand/icons/hotel.svg";

interface BuildPieceProps {
  kind: "house" | "hotel";
  compact?: boolean;
}

function BuildPiece({ kind, compact }: BuildPieceProps) {
  return (
    <img
      src={kind === "hotel" ? HOTEL_SRC : HOUSE_SRC}
      alt=""
      draggable={false}
      className={`build-piece build-piece-${kind}${compact ? " is-compact" : ""}`}
    />
  );
}

interface BuildMarkerProps {
  square: Pick<Square, "house" | "hotel">;
  className?: string;
  compact?: boolean;
}

export function BuildMarker({
  square,
  className = "",
  compact = false,
}: BuildMarkerProps) {
  const isHotel = square.hotel === 1 || square.house >= 5;
  const houses =
    !isHotel && square.house > 0 ? Math.min(4, Math.floor(square.house)) : 0;

  if (!isHotel && houses === 0) return null;

  if (isHotel) {
    return (
      <span
        className={`build-marker build-hotel ${compact ? "build-compact" : ""} ${className}`.trim()}
        title="hotel"
        aria-label="hotel"
      >
        <BuildPiece kind="hotel" compact={compact} />
      </span>
    );
  }

  const label = houses === 1 ? "1 house" : `${houses} houses`;

  return (
    <span
      className={`build-marker build-houses ${compact ? "build-compact" : ""} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      {Array.from({ length: houses }, (_, index) => (
        <BuildPiece key={index} kind="house" compact={compact} />
      ))}
    </span>
  );
}
