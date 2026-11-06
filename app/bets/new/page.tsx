"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";

/** Old "post a bet" screen. Betting now happens in the pools on the Bets page. */
export default function NewBetPage() {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const match = q.get("match");
    router.replace(match ? `/bets#pool-${match}` : "/bets");
  }, [router]);
  return <Loading />;
}
