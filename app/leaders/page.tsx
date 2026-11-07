"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";

/** The individual leaderboard is gone now that both days are team scrambles. */
export default function LeadersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/teams");
  }, [router]);
  return <Loading />;
}
