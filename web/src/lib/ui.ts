export const panel =
  "flex min-h-0 flex-col overflow-hidden rounded-panel border border-line bg-surface";

export const input =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] text-body outline-none placeholder:text-[#5c5c68] focus:border-accent";

export const fieldLabel =
  "text-[11px] font-bold tracking-[0.06em] text-dim uppercase";

export const field = "flex flex-col gap-1.5";

export const buyButton =
  "rounded-[10px] border-none bg-accent p-3.5 text-[14px] font-bold text-white hover:not-disabled:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45";

export const errorBox =
  "rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-[12px] text-[#ffb3c0]";

export const action =
  "inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-4 py-2.5 text-[13px] font-semibold text-body transition-colors hover:not-disabled:border-[#3e3e48] hover:not-disabled:bg-[#2a2a32] disabled:cursor-not-allowed disabled:opacity-40";

export const iconButton =
  "inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-[12px] font-semibold text-body transition-colors hover:border-[#3e3e48] hover:bg-[#2a2a32]";

export const dangerButton =
  "inline-flex items-center gap-1.5 rounded-[10px] border border-bad/45 bg-transparent px-3 py-2 text-[12px] font-semibold text-[#f07a8a] transition-colors hover:border-bad hover:bg-bad/10 hover:text-[#ff8f9d]";

export const panelClose =
  "border-none bg-transparent px-1 py-0.5 text-[14px] text-inherit opacity-85 hover:opacity-100";

export const feed =
  "flex min-h-[120px] flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-panel border border-line bg-surface p-2.5 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]";

export const playerCard =
  "relative flex items-center gap-2.5 rounded-panel border border-line bg-surface px-3 py-2.5";

export const avatar =
  "grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-[#0b0b0f]";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export const overlay = "fixed inset-0 z-40 bg-black/65";

export const overlayWrap =
  "pointer-events-none fixed inset-0 z-41 grid place-items-center p-5";

export const dialogCard =
  "pointer-events-auto max-h-[85vh] w-[min(360px,100%)] overflow-auto rounded-panel border border-line bg-surface text-body shadow-panel";

export const dialogTitle =
  "flex items-center gap-2 border-b border-line px-3 py-2.5 text-[13px] font-bold";

export const dialogMessage = "px-3 py-3.5 text-[13px]";

export const dialogActions = "flex flex-wrap gap-1.5 px-3 pb-3";

export const liveBar =
  "rounded-t-panel bg-accent px-3.5 py-2.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase";

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-chip border border-line bg-surface-2 px-3.5 py-2.25 text-[13px] font-semibold text-body transition-colors hover:not-disabled:border-[#3a3a44] hover:not-disabled:bg-[#2a2a32] disabled:cursor-not-allowed disabled:opacity-40";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-chip border border-accent bg-accent px-3.5 py-2.25 text-[13px] font-semibold text-white transition-colors hover:not-disabled:border-accent-hover hover:not-disabled:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";
