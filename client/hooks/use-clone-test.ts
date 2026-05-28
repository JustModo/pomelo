"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cloneTestAction } from "@/app/actions/clone-test";

interface CloneOptions {
  confirmMessage?: string;
  onSuccess?: (newTestId: string) => void;
}

export function useCloneTest(testId: string) {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = useCallback(
    async (options: CloneOptions = {}) => {
      if (isCloning) return;

      const message =
        options.confirmMessage || "Are you sure you want to duplicate this test?";
      if (!confirm(message)) return;

      setIsCloning(true);
      const res = await cloneTestAction(testId);
      setIsCloning(false);

      if (res.success && res.newTestId) {
        if (options.onSuccess) {
          options.onSuccess(res.newTestId);
        } else {
          router.push(`/admin/tests/${res.newTestId}/edit`);
        }
      } else {
        alert(res.message);
      }
    },
    [isCloning, router, testId]
  );

  return { isCloning, handleClone };
}
