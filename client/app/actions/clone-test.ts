"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/env";

export async function cloneTestAction(id: string) {
    try {
        const session = await auth();
        const token = session?.backendToken;

        const url = `${getBaseUrl()}/api/admin/tests/${id}/clone`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(`[CloneTest] Non-JSON response (${res.status} ${res.statusText}):`, text.slice(0, 500));
            throw new Error(`Server returned ${res.status} ${res.statusText} (non-JSON)`);
        }

        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to clone test");
        }

        revalidatePath("/admin/tests");
        return { success: true, message: "Test cloned successfully", newTestId: json.contestId };
    } catch (error) {
        console.error("Error cloning test:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to clone test",
        };
    }
}
