"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeXml, EyeOff } from "lucide-react";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CodingProblem } from "@/types/problem";

interface TestCaseResult {
  testCase: number;
  passed: boolean;
  status: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  isVisible: boolean;
}

export default function TestCasePanel({
  problem,
  code,
  language,
}: {
  problem: CodingProblem;
  code: string;
  language: string;
}) {
  const { testid } = useParams();
  const { data: session } = useSession();
  const [view, setView] = useState<"initial" | "sample" | "hidden">("initial");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);

  const handleRun = async () => {
    if (!session?.backendToken) return toast.error("Please login first");
    setIsRunning(true);
    setView("sample");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test/${testid}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.backendToken}`
        },
        body: JSON.stringify({
          questionId: problem.id,
          code,
          language
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
      }
    } catch {
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!session?.backendToken) return toast.error("Please login first");
    setIsRunning(true);
    setView("hidden");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test/${testid}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.backendToken}`
        },
        body: JSON.stringify({
          contestId: testid,
          questionId: problem.id,
          code,
          language
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
      }
    } catch {
    } finally {
      setIsRunning(false);
    }
  };

  const failedCount = results.filter((r) => !r.passed).length;
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between text-sm h-11 bg-muted">
        <Label className="flex items-center gap-2">
          <CodeXml className="h-4 w-4" />
          Test Cases
        </Label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning && view === 'sample' ? "Running..." : "Run"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning}
          >
            {isRunning && view === 'hidden' ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 p-4 pr-4 overflow-y-auto">
        {view === "initial" && (
          <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-full gap-2 py-10">
            <EyeOff className="w-6 h-6" />
            <p>You haven’t run your code yet.</p>
          </div>
        )}

        {view === "sample" && (
          <div className="space-y-4">
            {results.map((tc, idx) => (
              <div
                key={idx}
                className="border rounded-md p-3 space-y-2 text-sm"
              >
                <div className="flex justify-between">
                  <Label>Test Case {idx + 1}</Label>
                  <Badge
                    variant={tc.passed ? "default" : "destructive"}
                  >
                    {tc.status}
                  </Badge>
                </div>

                {tc.input && (
                  <div>
                    <p className="text-muted-foreground">Input:</p>
                    <pre className="bg-muted px-2 py-1 rounded">{tc.input}</pre>
                  </div>
                )}

                {tc.expectedOutput && (
                  <div>
                    <p className="text-muted-foreground">Expected Output:</p>
                    <pre className="bg-muted px-2 py-1 rounded">
                      {tc.expectedOutput}
                    </pre>
                  </div>
                )}

                {tc.actualOutput !== undefined && (
                  <div>
                    <p className="text-muted-foreground">My Output:</p>
                    <pre
                      className={`px-2 py-1 rounded ${tc.passed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        }`}
                    >
                      {tc.actualOutput || (tc.error ? "Error: " + tc.error : "")}
                    </pre>
                  </div>
                )}
                {!tc.isVisible && !tc.passed && tc.error && (
                  <div className="text-destructive text-xs">
                    {tc.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {view === "hidden" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-4 text-center">
                <div className="text-muted-foreground text-xs">Passed</div>
                <div className="text-2xl font-semibold text-primary">
                  {passedCount}
                </div>
              </div>
              <div className="border rounded-md p-4 text-center">
                <div className="text-muted-foreground text-xs">Failed</div>
                <div className="text-2xl font-semibold text-destructive">
                  {failedCount}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {results.map((tc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border rounded px-4 py-2"
                >
                  <div className="text-sm font-medium text-muted-foreground">
                    {tc.isVisible ? `Sample Case ${idx + 1}` : `Hidden Case ${idx + 1}`}
                  </div>
                  <Badge
                    variant={
                      tc.passed
                        ? "default"
                        : "destructive"
                    }
                  >
                    {tc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
