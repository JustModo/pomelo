"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTestCompletion } from "./use-test-completion";
import { getBaseUrl } from "@/lib/env";
import { getContestData } from "@/actions/contest";
import { readViolationCount, MAX_VIOLATIONS } from "@/lib/attempt-integrity";

type ProblemMeta = {
  id: string;
  type: string;
};

interface TestHeaderProps {
  problems: ProblemMeta[];
}

export default function TestHeader({ problems }: TestHeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { data: session } = useSession();
  const { completeTest, isSubmitting } = useTestCompletion();
  const [violations, setViolations] = React.useState(0);

  // Sync with cross-tab/local violation updates
  React.useEffect(() => {
    if (params.testid) {
      setViolations(readViolationCount(params.testid as string));
    }

    const handleViolationUpdate = (e: any) => {
      setViolations(e.detail.count);
    };

    window.addEventListener("pomelo-violation-update", handleViolationUpdate);
    return () => window.removeEventListener("pomelo-violation-update", handleViolationUpdate);
  }, [params.testid]);

  // Handle BFCache (Back/Forward Cache)
  // If user presses back button after finishing, force a refresh to trigger server-side checks
  React.useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // Client-side verification on mount to handle back navigation / stale cache
  React.useEffect(() => {
    const verifyStatus = async () => {
      if (!params.testid) return;
      try {
        const data = await getContestData(params.testid as string);
        // If server says completed or prohibited, kick them out
        if (!data.success || (data.data?.isCompleted)) {
          router.replace(`/test/${params.testid}`);
        }
      } catch {
        // network error etc, maybe safe to ignore or retry
      }
    };
    verifyStatus();
  }, [params.testid, router]);

  const handleFinish = async () => {
    if (!session?.backendToken || !params.testid) return;
    if (!confirm("Are you sure you want to finish the test? You cannot change your answers after this.")) return;

    await completeTest({ replace: false });
  };

  const currentId = pathname.split("/").pop();

  const scroll = (distance: number) => {
    scrollRef.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  const isCoding = (p: ProblemMeta) => {
    return p.type === 'coding' || p.type === 'Coding';
  };

  const codingProblems = problems.filter(isCoding);
  const mcqProblems = problems.filter((p) => !isCoding(p));

  return (
    <div className="flex items-center justify-center p-2 select-none h-12 absolute top-0 w-screen bg-primary">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center shrink-0">
        <div 
          className="flex items-center gap-1.5 px-3 h-8 bg-primary-foreground/10 text-primary-foreground/90 border border-primary-foreground/20 rounded-full text-xs font-medium hover:bg-primary-foreground/20 transition-colors"
          title={`${MAX_VIOLATIONS - violations} warnings left`}
        >
          <ShieldAlert className="h-3.5 w-3.5 text-primary-foreground/70" />
          <span>{MAX_VIOLATIONS - violations}</span>
        </div>
      </div>

      <Button
        variant="secondary"
        size="icon"
        className="bg-muted rounded-none rounded-l-lg"
        onClick={() => scroll(-300)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div ref={scrollRef} className="overflow-x-auto no-scrollbar max-w-[50vw] sm:max-w-[60vw] lg:max-w-[800px]">
        <div className="flex w-max bg-background h-9">
          {mcqProblems.length > 0 && (
            <div className="flex items-center rounded-md px-2 py-1">
              <div className="px-2 flex items-center text-xs font-bold text-muted-foreground bg-muted rounded-sm mr-2 py-1">
                MCQ
              </div>
              <div className="flex gap-1">
                {mcqProblems.map((problem, i) => {
                  const isActive = String(problem.id) === currentId;
                  return (
                    <Button
                      key={problem.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-sm data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      data-state={isActive ? "active" : undefined}
                      onClick={() =>
                        router.push(`/attempt/test/${params.testid}/question/${problem.id}`)
                      }
                    >
                      {i + 1}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          {codingProblems.length > 0 && (
            <div className="flex items-center rounded-md px-2 py-1">
              <div className="px-2 flex items-center text-xs font-bold text-muted-foreground bg-muted rounded-sm mr-2 py-1">
                CODE
              </div>
              <div className="flex gap-1">
                {codingProblems.map((problem, i) => {
                  const isActive = String(problem.id) === currentId;
                  return (
                    <Button
                      key={problem.id}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-sm data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      data-state={isActive ? "active" : undefined}
                      onClick={() =>
                        router.push(`/attempt/test/${params.testid}/question/${problem.id}`)
                      }
                    >
                      {i + 1}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="secondary"
        size="icon"
        className="bg-muted rounded-none rounded-r-lg"
        onClick={() => scroll(300)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center ml-4 mr-2 shrink-0">
        <Button
          variant={"secondary"}
          className="text-sm bg-green-600 hover:bg-green-700 text-white border-none h-9"
          onClick={handleFinish}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Finishing..." : "Submit"}
          {!isSubmitting && <BadgeCheck className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
