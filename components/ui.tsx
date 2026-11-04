"use client";

import Link from "next/link";
import type { Player, Side, TeamId } from "@/lib/types";

export const teamText: Record<TeamId, string> = { A: "text-ta", B: "text-tb" };
export const teamBg: Record<TeamId, string> = { A: "bg-ta", B: "bg-tb" };
export const teamSoft: Record<TeamId, string> = { A: "bg-ta/15", B: "bg-tb/15" };
export const teamBorder: Record<TeamId, string> = { A: "border-ta/60", B: "border-tb/60" };
export const teamRing: Record<TeamId, string> = { A: "ring-ta", B: "ring-tb" };
export const teamGrad: Record<TeamId, string> = {
  A: "from-ta/40 via-ta/10 to-transparent",
  B: "from-tb/40 via-tb/10 to-transparent",
};

export function photoUrl(p: Player) {
  return p.photoV ? `/api/photo/${p.id}?v=${p.photoV}` : null;
}

export function Avatar({ p, size = 40, className = "" }: { p: Player; size?: number; className?: string }) {
  const url = photoUrl(p);
  const ring = p.team ? `ring-2 ${teamRing[p.team]}` : "ring-2 ring-line";
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-card2 ${ring} ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={p.name} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-display font-bold uppercase text-white/90"
          style={{ fontSize: size * 0.42 }}
        >
          {p.name.slice(0, 2)}
        </div>
      )}
    </div>
  );
}

export function AvatarStack({ ps, size = 32 }: { ps: Player[]; size?: number }) {
  return (
    <div className="flex -space-x-2">
      {ps.map((p) => (
        <Avatar key={p.id} p={p} size={size} />
      ))}
    </div>
  );
}

export function Live() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-tb/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tb">
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-tb" /> Live
    </span>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export function OddsChip({ label, odds, tone }: { label?: string; odds: string; tone?: Side | "draw" }) {
  const border = tone === "A" ? "border-ta/40" : tone === "B" ? "border-tb/40" : "border-line";
  return (
    <div className={`flex min-w-[64px] flex-col items-center rounded-lg border ${border} bg-black/30 px-2 py-1`}>
      {label && <span className="max-w-[80px] truncate text-[10px] font-semibold uppercase text-muted">{label}</span>}
      <span className="font-display text-lg font-bold leading-tight text-gold tabular">{odds}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between px-1">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">{children}</h2>
      {right}
    </div>
  );
}

export function Button({
  children,
  onClick,
  href,
  variant = "neon",
  className = "",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "neon" | "ghost" | "danger" | "gold";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const v = {
    neon: "bg-neon text-black shadow-[0_0_24px_rgba(0,240,138,0.35)] active:brightness-90",
    gold: "bg-gold text-black shadow-[0_0_24px_rgba(255,210,63,0.3)] active:brightness-90",
    ghost: "border border-line bg-card2 text-white active:bg-line",
    danger: "border border-tb/50 bg-tb/10 text-tb active:bg-tb/20",
  }[variant];
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-base font-bold uppercase tracking-wide transition disabled:opacity-40 ${v} ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>;
}
