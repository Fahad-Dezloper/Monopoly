/** Shared Solana City light UI class strings. */

export const panel =
  "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e9e2ff] bg-white shadow-sm";

export const input =
  "w-full rounded-xl border border-[#ddd6fe] bg-[#fcfaff] px-3.5 py-2.5 text-[13px] font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20";

export const fieldLabel =
  "text-[11px] font-extrabold tracking-wider text-[#7c3aed] uppercase";

export const field = "flex flex-col gap-1.5";

export const buyButton =
  "rounded-full border-none bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] p-3.5 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(124,58,237,0.35)] hover:not-disabled:opacity-95 disabled:cursor-not-allowed disabled:opacity-45";

export const errorBox =
  "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] font-semibold text-rose-600";

export const action =
  "inline-flex items-center gap-2 rounded-full border border-[#e9e2ff] bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:not-disabled:border-[#7c3aed]/35 hover:not-disabled:bg-[#f8f6ff] hover:not-disabled:text-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40";

export const panelClose =
  "border-none bg-transparent px-1 py-0.5 text-[14px] text-slate-400 opacity-85 hover:text-slate-700 hover:opacity-100";

export const feed =
  "flex min-h-[120px] flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-2xl border border-[#e9e2ff] bg-white p-2.5 [scrollbar-color:#e9e2ff_transparent] [scrollbar-width:thin]";

export const playerCard =
  "relative flex items-center gap-2.5 rounded-2xl border border-[#e9e2ff] bg-white px-3 py-2.5";

export const avatar =
  "grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export const overlay = "fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px]";

export const overlayWrap =
  "pointer-events-none fixed inset-0 z-41 grid place-items-center p-5";

export const dialogCard =
  "pointer-events-auto max-h-[85vh] w-[min(360px,100%)] overflow-auto rounded-3xl border border-[#e9e2ff] bg-white text-slate-800 shadow-2xl";

export const liveBar =
  "rounded-t-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-3.5 py-2.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase";

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e9e2ff] bg-white px-3.5 py-2.25 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:not-disabled:border-[#7c3aed]/35 hover:not-disabled:bg-[#f8f6ff] disabled:cursor-not-allowed disabled:opacity-40";

/** Game shell background — always light lavender-white */
export const gameShell = "bg-[#f5f3ff] text-slate-800";
