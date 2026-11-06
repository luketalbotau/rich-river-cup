"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";

/** Old "post a bet" screen. Betting now happens on the Bets page. */
export default function NewBetPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/bets");
  }, [router]);
  return <Loading />;
}
