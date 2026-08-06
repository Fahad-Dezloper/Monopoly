"use client";

import { useState } from "react";
import { action, fieldLabel } from "@/lib/ui";

interface RoomCodeCardProps {
  code: string;
}

export function RoomCodeCard({ code }: RoomCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className={fieldLabel}>Room code</span>
      <div className="rounded-panel border border-line bg-shell-2 p-3.5 text-center text-[28px] font-extrabold tracking-[0.24em] text-white">
        {code}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${action} flex-1 justify-center`}
          onClick={() => copy(code)}
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
        <button
          type="button"
          className={`${action} flex-1 justify-center`}
          onClick={() => copy(`${window.location.origin}/?join=${code}`)}
        >
          Copy invite link
        </button>
      </div>
    </div>
  );
}
