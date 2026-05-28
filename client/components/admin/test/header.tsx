"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function TestHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 bg-card border border-border rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-md">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          Tests
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl">
          Create and manage coding tests for your students
        </p>
      </div>
      <Link href="/admin/tests/new/edit">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Test
        </Button>
      </Link>
    </div>
  );
}
