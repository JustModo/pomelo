"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/env";

export async function deleteQuestion(id: string) {
    try {
        const session = await auth();
        const token = session?.backendToken;

        if (!token) {
            throw new Error("Authentication required");
        }

        const url = `${getBaseUrl()}/api/admin/questions/${id}`;

        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(`[DeleteQuestion] Non-JSON response (${res.status} ${res.statusText}):`, text.slice(0, 500));
            throw new Error(`Server returned ${res.status} ${res.statusText} (non-JSON)`);
        }

        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to delete question");
        }

        revalidatePath("/admin");
        revalidatePath("/admin/questions");
        revalidatePath("/admin/settings");

        return { success: true, message: "Question deleted successfully" };
    } catch (error) {
        console.error("Error deleting question:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete question",
        };
    }
}
