import type { Metadata } from "next";
import { auth } from "@/auth";
import { TestsList } from "@/components/admin/test/tests-list";
import { getBaseUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Manage Tests",
  description: "View and manage code assessment tests on Pomelo.",
};

export const dynamic = "force-dynamic";

async function getTests() {
  try {
    const session = await auth();
    const token = session?.backendToken;
    const res = await fetch(`${getBaseUrl()}/api/admin/tests`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) return data.contests;
    return [];
  } catch (error) {
    console.error("Error fetching admin tests:", error);
    return [];
  }
}

export default async function AdminTestsPage() {
  const tests = await getTests();
  return <TestsList initialTests={tests} />;
}
