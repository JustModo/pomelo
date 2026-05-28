import { Test } from "@/types/test";

export type TestStatus = Test["status"];

export const getTestStatusLabel = (status: TestStatus) => {
  switch (status) {
    case "ongoing":
      return "Active";
    case "completed":
      return "Completed";
    default:
      return "Waiting";
  }
};

export const getTestStatusBadgeVariant = (status: TestStatus) => {
  switch (status) {
    case "ongoing":
      return "default" as const;
    case "waiting":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};
