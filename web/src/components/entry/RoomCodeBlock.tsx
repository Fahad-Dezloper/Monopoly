"use client";

import { useState } from "react";
import { CopiedIcon, CopyIcon } from "@/components/shared/icons";
import { action, cx, fieldLabel } from "@/lib/ui";

interface RoomCodeBlockProps {
  code: string;
}

export function RoomCodeBlock({ code }: RoomCodeBlockProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = async (what: "code" | "link", text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className={fieldLabel}>Room code</span>
      <div className="rounded-sm border border-line bg-shell-2 py-3.5 text-center text-[30px] leading-none font-extrabold tracking-[0.26em] text-white">
        {code}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={cx(action, "h-9 flex-1 justify-center")}
          onClick={() => copy("code", code)}
        >
          {copied === "code" ? (
            <CopiedIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          className={cx(action, "h-9 flex-1 justify-center")}
          onClick={() =>
            copy("link", `${window.location.origin}/?join=${code}`)
          }
        >
          {copied === "link" ? (
            <CopiedIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          {copied === "link" ? "Copied" : "Invite link"}
        </button>
      </div>
    </div>
  );
}
