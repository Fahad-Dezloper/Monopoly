"use client";

import { HouseIcon } from "@/components/shared/icons";
import { mortgageValue } from "@/lib/monopoly/building";
import type { Square } from "@/lib/monopoly/types";
import { cx } from "@/lib/ui";

interface RentRowProps {
  label: string;
  value: string;
  pips?: { count: number; hotel?: boolean };
}

function RentRow({ label, value, pips }: RentRowProps) {
  return (
    <div className="flex items-center justify-between gap-2.5 border-b border-line-soft py-2 text-[13px] text-dim">
      <span className="inline-flex items-center gap-1.5">
        {label}
        {pips && (
          <span
            className={cx(
              "inline-flex gap-0.5",
              pips.hotel ? "text-[#ef4444]" : "text-[#22c55e]",
            )}
            aria-hidden
          >
            {Array.from({ length: pips.count }).map((_, index) => (
              <HouseIcon key={index} className="size-4" />
            ))}
          </span>
        )}
      </span>
      <span className="font-bold tabular-nums text-body">{value}</span>
    </div>
  );
}

function RentGroup({ children }: { children: React.ReactNode }) {
  return <div className="[&>*:last-child]:border-b-0">{children}</div>;
}

interface RentTableProps {
  square: Square;
}

export function RentTable({ square }: RentTableProps) {
  const mortgage = mortgageValue(square);

  if (square.groupNumber >= 3) {
    return (
      <>
        <RentGroup>
          <RentRow label="Rent" value={`$ ${square.baserent}`} />
          <RentRow
            label="Rent with set"
            value={`$ ${square.monopolyrent || square.baserent * 2}`}
          />
          <RentRow
            label="Rent with"
            value={`$ ${square.rent1}`}
            pips={{ count: 1 }}
          />
          <RentRow
            label="Rent with"
            value={`$ ${square.rent2}`}
            pips={{ count: 2 }}
          />
          <RentRow
            label="Rent with"
            value={`$ ${square.rent3}`}
            pips={{ count: 3 }}
          />
          <RentRow
            label="Rent with"
            value={`$ ${square.rent4}`}
            pips={{ count: 4 }}
          />
          <RentRow
            label="Rent with"
            value={`$ ${square.rent5}`}
            pips={{ count: 1, hotel: true }}
          />
        </RentGroup>
        <div className="my-1.5 h-px bg-line" />
        <RentGroup>
          <RentRow label="House Price" value={`$ ${square.houseprice} each`} />
          <RentRow
            label="Hotel Price"
            value={`$ ${square.hotelprice || square.houseprice} each`}
          />
          <RentRow label="Mortgage" value={`$ ${mortgage}`} />
        </RentGroup>
      </>
    );
  }

  if (square.groupNumber === 1) {
    return (
      <>
        <RentGroup>
          <RentRow label="1 hub owned" value={`$ ${square.rent1}`} />
          <RentRow label="2 hubs owned" value={`$ ${square.rent2}`} />
          <RentRow label="3 hubs owned" value={`$ ${square.rent3}`} />
          <RentRow label="4 hubs owned" value={`$ ${square.rent4}`} />
        </RentGroup>
        <div className="my-1.5 h-px bg-line" />
        <RentGroup>
          <RentRow label="Mortgage" value={`$ ${mortgage}`} />
        </RentGroup>
      </>
    );
  }

  if (square.groupNumber === 2) {
    return (
      <>
        <RentGroup>
          <RentRow label="1 utility owned" value={`${square.rent1} × dice`} />
          <RentRow label="Both utilities" value={`${square.rent2} × dice`} />
        </RentGroup>
        <div className="my-1.5 h-px bg-line" />
        <RentGroup>
          <RentRow label="Mortgage" value={`$ ${mortgage}`} />
        </RentGroup>
      </>
    );
  }

  return null;
}
