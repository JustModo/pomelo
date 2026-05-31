"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeXml, EyeOff, CheckCircle2, XCircle } from "lucide-react";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CodingProblem } from "@/types/problem";

import { runCode, submitCode } from "@/actions/contest";

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
  const [activeTestCase, setActiveTestCase] = useState(0);

  const handleRun = async () => {
    if (!testid) return toast.error("Test ID missing");
    setIsRunning(true);
    setResults([]);
    setView("sample");
    try {
      const data = await runCode(testid as string, String(problem.id), code, language);
      if (data.success) {
        setResults(data.results);
      } else {
        toast.error(data.error || data.message || "Failed to run code");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!testid) return toast.error("Test ID missing");
    setIsRunning(true);
    setResults([]);
    setView("hidden");
    try {
      const data = await submitCode(testid as string, String(problem.id), code, language);
      if (data.success) {
        setResults(data.results);
      } else {
        toast.error(data.error || data.message || "Failed to submit code");
      }
    } catch {
      toast.error("Network error");
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
        {isRunning && (
          <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-full gap-3 py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p>Executing code, please wait...</p>
          </div>
        )}

        {!isRunning && view === "initial" && (
          <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-full gap-2 py-10">
            <EyeOff className="w-6 h-6" />
            <p>You haven’t run your code yet.</p>
          </div>
        )}

        {!isRunning && view === "sample" && results.length > 0 && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/50 no-scrollbar">
              {results.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestCase(idx)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTestCase === idx
                      ? tc.passed
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border border-transparent"
                  }`}
                >
                  {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Case {idx + 1}
                </button>
              ))}
            </div>

            <div className="pt-2">
              {results[activeTestCase] && (
                <div className="space-y-5">
                  {results[activeTestCase].input && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Input</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] overflow-x-auto border border-border/50">
                        {results[activeTestCase].input}
                      </pre>
                    </div>
                  )}

                  {results[activeTestCase].expectedOutput && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Expected Output</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] overflow-x-auto border border-border/50">
                        {results[activeTestCase].expectedOutput}
                      </pre>
                    </div>
                  )}

                  {results[activeTestCase].actualOutput !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Your Output</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] overflow-x-auto border border-border/50">
                        {results[activeTestCase].actualOutput !== "" 
                          ? results[activeTestCase].actualOutput 
                          : <span className="text-muted-foreground italic">No output</span>}
                      </pre>
                    </div>
                  )}
                  
                  {!results[activeTestCase].passed && results[activeTestCase].error && (
                    <div className="space-y-1.5">
                      <Label className="text-destructive font-semibold uppercase tracking-wider text-[11px]">Error Logs</Label>
                      <pre className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg font-mono text-[13px] overflow-x-auto border border-destructive/20 whitespace-pre-wrap">
                        {results[activeTestCase].error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!isRunning && view === "hidden" && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 border rounded-md py-2 px-3 flex items-center justify-between bg-primary/5 border-primary/10">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Passed</div>
                <div className="text-sm font-bold text-primary">
                  {results.filter(r => r.passed).length}
                </div>
              </div>
              <div className="flex-1 border rounded-md py-2 px-3 flex items-center justify-between bg-destructive/5 border-destructive/10">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Failed</div>
                <div className="text-sm font-bold text-destructive">
                  {results.filter(r => !r.passed).length}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {results.map((tc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border rounded-md px-4 py-3 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {tc.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <div className="text-sm font-medium text-foreground">
                      {tc.isVisible ? `Sample Case ${idx + 1}` : `Hidden Case ${idx + 1}`}
                    </div>
                  </div>
                  <Badge variant={tc.passed ? "default" : "destructive"}>
                    {tc.passed ? "Passed" : tc.status}
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
