import type { Metadata } from "next";
import TestHeader from "@/components/attempt/test-header";
import IntegrityMonitor from "@/components/attempt/integrity-monitor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";
import { getBaseUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Test Attempt",
  description: "Test taking assessment environment on Pomelo.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function TestLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ testid: string; qid: string }>;
}) {
  const { testid } = await params;
  const session = await auth();

  const res = await fetch(`${getBaseUrl()}/api/test/${testid}/data`, {
    headers: {
      "Authorization": `Bearer ${session?.backendToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const result = await res.json();

  /*
   * SECURITY CHECK:
   * If the user has completed the test, the middleware returns 403.
   * We must redirect them out of the attempt area immediately.
   */
  if (!res.ok || !result.success || result.isCompleted) {
    redirect(`/test/${testid}`);
  }

  const problems = result.data?.problems || [];

  const problemMeta = problems.map((q: { id: string; type: string }) => ({
    id: q.id,
    type: q.type
  }));

  return (
    <main className="w-screen h-screen pt-12">
      <IntegrityMonitor />
      <TestHeader problems={problemMeta} />
      {children}
    </main>
  );
}
