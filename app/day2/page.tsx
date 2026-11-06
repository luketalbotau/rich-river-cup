"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";

/** Pairs are now set by the draft order, so there is nothing to pick here. */
export default function Day2Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <Loading />;
}
