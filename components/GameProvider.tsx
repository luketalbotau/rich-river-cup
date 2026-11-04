"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { derive, type Derived } from "@/lib/logic";
import type { Player, State } from "@/lib/types";

interface Ctx {
  state: State | null;
  d: Derived | null;
  me: Player | null;
  error: string | null;
  act: (type: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  toast: (msg: string, kind?: "ok" | "err") => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: "ok" | "err" }[]>([]);
  const lastAction = useRef(0);

  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const refresh = useCallback(async () => {
    const started = Date.now();
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      const j = await r.json();
      if (started < lastAction.current) return; // a newer action result already landed
      if (!r.ok) {
        setError(j.error ?? "Couldn't load");
        return;
      }
      setError(null);
      setState(j);
    } catch {
      setError("Offline. Retrying…");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 3500);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const act = useCallback<Ctx["act"]>(
    async (type, payload = {}) => {
      lastAction.current = Date.now();
      try {
        const r = await fetch("/api/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, ...payload }),
        });
        const j = await r.json();
        lastAction.current = Date.now();
        if (j.state) setState(j.state);
        if (!j.ok) toast(j.error ?? "Something went wrong", "err");
        return j;
      } catch {
        toast("No connection, try again", "err");
        return { ok: false, error: "offline" };
      }
    },
    [toast],
  );

  const d = useMemo(() => (state ? derive(state) : null), [state]);
  const me = useMemo(() => state?.players.find((p) => p.id === state.me) ?? null, [state]);

  return (
    <GameCtx.Provider value={{ state, d, me, error, act, toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pop-in pointer-events-auto max-w-sm rounded-xl px-4 py-2.5 text-sm font-semibold shadow-2xl ${
              t.kind === "err" ? "bg-tb text-white" : "bg-neon text-black"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </GameCtx.Provider>
  );
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}
