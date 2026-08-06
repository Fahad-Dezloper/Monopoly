"use client";

import { useState } from "react";
import { SendIcon } from "@/components/shared/icons";
import { cx, input } from "@/lib/ui";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}

export function ChatComposer({
  onSend,
  onFocus,
  placeholder = "Type a message…",
  className,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <form
      className={cx("flex gap-1.5", className)}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        className={input}
        value={draft}
        maxLength={240}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={onFocus}
      />
      <button
        type="submit"
        className="grid w-10 shrink-0 place-items-center rounded-[10px] border border-line bg-accent text-white disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-dim"
        disabled={!draft.trim()}
        aria-label="Send message"
      >
        <SendIcon className="size-4.5" />
      </button>
    </form>
  );
}
