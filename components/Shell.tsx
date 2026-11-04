"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { betStatus } from "@/lib/logic";
import { useGame } from "./GameProvider";
import { Avatar } from "./ui";

const I = {
  board: (
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  ),
  bets: (
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7ZM14 5v12" />
  ),
  ledger: (
    <path d="M12 3v18M17 7.5C17 5.6 14.8 4.5 12 4.5S7 5.6 7 7.5s2 2.7 5 3.5 5 1.8 5 4-2.2 3-5 3-5-1.1-5-3" />
  ),
  squad: (
    <path d="M7 4h7l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 16c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2" />
  ),
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />,
};

function Icon({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}

export function Header() {
  const { me, error } = useGame();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon font-display text-lg font-black text-black">
            ⛳
          </span>
          <span className="font-display text-xl font-extrabold uppercase italic tracking-tight">
            {APP_NAME.replace(/^The /, "")}
          </span>
        </Link>
        {me ? (
          <Link href={`/players/${me.id}`} className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3">
            <Avatar p={me} size={26} />
            <span className="text-sm font-semibold">{me.name}</span>
          </Link>
        ) : (
          <Link href="/login" className="rounded-full bg-neon px-4 py-1.5 font-display text-sm font-bold uppercase text-black">
            Log in
          </Link>
        )}
      </div>
      {error && <div className="bg-tb/90 px-4 py-1 text-center text-xs font-semibold">{error}</div>}
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { state, d } = useGame();
  const openBets =
    state && d ? state.bets.filter((b) => b.creatorId !== state.me && betStatus(b, d).status === "open").length : 0;
  const items = [
    { href: "/", label: "Board", icon: I.board, match: (p: string) => p === "/" || p.startsWith("/match") || p.startsWith("/draft") || p.startsWith("/day2") || p.startsWith("/victory") },
    { href: "/bets", label: "Bets", icon: I.bets, badge: openBets, match: (p: string) => p.startsWith("/bets") },
    { href: "/ledger", label: "Owed", icon: I.ledger, match: (p: string) => p.startsWith("/ledger") },
    { href: "/players", label: "Squad", icon: I.squad, match: (p: string) => p.startsWith("/players") || p.startsWith("/login") },
    { href: "/more", label: "More", icon: I.more, match: (p: string) => p.startsWith("/more") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <Link key={it.href} href={it.href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-neon" : "text-muted"}`}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-neon shadow-[0_0_12px_#00f08a]" />}
              <Icon d={it.icon} />
              {it.label}
              {!!it.badge && (
                <span className="absolute right-[22%] top-1 min-w-[18px] rounded-full bg-gold px-1 text-center text-[10px] font-bold text-black">
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
