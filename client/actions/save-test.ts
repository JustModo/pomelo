"use server";

import { testSchema, TestSchema } from "@/types/test";
import { revalidatePath } from "next/cache";
import { fetchBackend } from "@/lib/fetch";

function parseDuration(duration: string) {
  const match = duration.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    throw new Error("End time must be in HH:MM AM/PM format");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error("End time must be in HH:MM AM/PM format");
  }

  let normalizedHours = hours % 12;
  if (period === "PM") {
    normalizedHours += 12;
  }

  return {
    hours: normalizedHours,
    minutes,
    seconds: 0,
  };
}

export async function saveTest(_prevState: Record<string, unknown>, data: TestSchema) {
  try {
    const validatedData = testSchema.parse(data);
    const { hours, minutes, seconds } = parseDuration(String(validatedData.duration));
    const startDate = new Date(validatedData.startsAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000;

    if (startDate.getTime() < now.getTime() - bufferMs) {
      throw new Error("Start time cannot be in the past");
    }

    const endDate = new Date(startDate);

    endDate.setHours(hours, minutes, seconds, 0);

    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const payload = {
      title: validatedData.title,
      description: validatedData.description,
      duration: {
        start: validatedData.startsAt,
        end: endDate.toISOString()
      },
      problemIds: validatedData.problems,
      rules: validatedData.rules,
      author: "Admin"
    };

    const isUpdate = !!validatedData.id;
    const url = isUpdate
      ? `/api/admin/tests/${validatedData.id}/edit`
      : `/api/admin/tests/create`;
    const method = isUpdate ? "PUT" : "POST";

    const json = await fetchBackend(url, {
      method: method,
      body: JSON.stringify(payload),
    });

    if (!json.success) {
      throw new Error(json.error || json.message || `Failed to ${isUpdate ? 'update' : 'save'} test`);
    }

    revalidatePath("/admin/tests");
    return {
      success: true,
      message: `Test ${isUpdate ? 'updated' : 'saved'} successfully`,
    };
  } catch (error) {
    console.error("Error saving test:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save test",
    };
  }
}
