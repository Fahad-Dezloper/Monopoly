"use client";

import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { chain as getChain } from "@/lib/chain/client";
import { MIN_BALANCE_LAMPORTS } from "@/lib/chain/burner";

interface DevnetWalletCardProps {
  onFundedChange?: (funded: boolean) => void;
}

export function DevnetWalletCard({ onFundedChange }: DevnetWalletCardProps) {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    try {
      const c = getChain();
      const addr = c.wallet.toBase58();
      setAddress(addr);
      const balLamports = await c.base.getBalance(c.wallet);
      const balSol = balLamports / LAMPORTS_PER_SOL;
      setBalance(balSol);
      const isFunded = balLamports >= MIN_BALANCE_LAMPORTS;
      onFundedChange?.(isFunded);
    } catch (e) {
      console.warn("Failed to fetch devnet balance", e);
    }
  }, [onFundedChange]);

  useEffect(() => {
    fetchBalance();
    const timer = setInterval(fetchBalance, 4000);
    return () => clearInterval(timer);
  }, [fetchBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBalance();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isFunded = balance !== null && balance >= 0.03;
  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Loading...";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[#7c3aed] text-[11px] font-extrabold tracking-wider uppercase mb-0.5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
          <span>Devnet Wallet</span>
        </div>

        {/* Status Badge */}
        {balance === null ? (
          <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full animate-pulse">
            Checking SOL...
          </span>
        ) : isFunded ? (
          <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Funded
          </span>
        ) : (
          <span className="text-[9.5px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            ⚠️ Need ≥0.03 SOL
          </span>
        )}
      </div>

      <div className="bg-[#f8f5ff] border border-[#e9e2ff] rounded-xl p-2 flex items-center justify-between gap-2 shadow-2xs">
        {/* Address & Balance */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-slate-700 truncate">
              {shortAddr}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              title="Copy wallet address"
              className="text-slate-400 hover:text-[#7c3aed] transition-colors"
            >
              {copied ? (
                <span className="text-[9px] font-bold text-emerald-600">
                  Copied!
                </span>
              ) : (
                <svg
                  className="w-3 h-3 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="text-xs font-black text-[#6d28d9] mt-0.5">
            {balance !== null ? `${balance.toFixed(3)} SOL` : "..."}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          disabled={refreshing}
          onClick={handleRefresh}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 shrink-0"
        >
          <svg
            className={`w-3.5 h-3.5 fill-none stroke-current stroke-[2.5] ${
              refreshing ? "animate-spin" : ""
            }`}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{refreshing ? "Checking..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}
