import { auth } from "@/auth";

import { getBaseUrl } from "@/lib/env";
const BASE_URL = getBaseUrl();

type Collection = "questions" | "contests" | "submissions";

interface QueryOptions {
    projection?: Record<string, number | boolean>;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    populate?: string | string[] | Record<string, unknown>[];
}

export const db = {
    find: async <T = unknown>(collection: Collection, filter: Record<string, unknown> = {}, options: QueryOptions = {}) => {
        try {
            const session = await auth();
            const token = session?.backendToken;

            const res = await fetch(`${BASE_URL}/api/admin/data`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    collection,
                    filter,
                    ...options,
                }),
                cache: "no-store",
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error(`db.find received non-JSON response from ${BASE_URL}/api/admin/data:`, text.slice(0, 500)); // Log first 500 chars
                throw new Error(`Received non-JSON response: ${text.slice(0, 100)}...`);
            }

            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || "DB Fetch Error");
            }

            return json.data as T[];
        } catch (error) {
            console.error(`db.find error [${collection}]:`, error);
            throw error;
        }
    },

    findOne: async <T = unknown>(collection: Collection, filter: Record<string, unknown> = {}, options: QueryOptions = {}) => {
        try {
            const session = await auth();
            const token = session?.backendToken;

            const res = await fetch(`${BASE_URL}/api/admin/data/one`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    collection,
                    filter,
                    ...options,
                }),
                cache: "no-store",
            });

            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || "DB Fetch One Error");
            }

            return json.data as T | null;
        } catch (error) {
            console.error(`db.findOne error [${collection}]:`, error);
            throw error;
        }
    },
};
