"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Problem, MCQProblem } from "@/types/problem";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface MCQScreenProps {
  problem: MCQProblem;
  problems: Problem[];
}

export default function MCQScreen({ problem, problems }: MCQScreenProps) {
  const [selected, setSelected] = useState<string[]>(problem.savedAnswer || []);
  const router = useRouter();
  const params = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const { data: session } = useSession();

  // Create sorting logic matching TestHeader: MCQs first, then Coding
  const mcqProblems = problems.filter((p) => p.questionType !== "Coding");
  const codingProblems = problems.filter((p) => p.questionType === "Coding");
  const sortedProblems = [...mcqProblems, ...codingProblems];

  const currentIndex = sortedProblems.findIndex((p) => String(p.id) === String(problem._id || problem.id));
  const prevProblem = sortedProblems[currentIndex - 1];
  const nextProblem = sortedProblems[currentIndex + 1];

  const handleSave = async (answers: string[]) => {
    if (!session?.backendToken || !params.testid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test/${params.testid}/mcq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.backendToken}`
        },
        body: JSON.stringify({
          contestId: params.testid,
          questionId: problem._id || problem.id,
          answer: answers
        })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to save answer");
      }
    } catch {
      toast.error("Network error saving answer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSingleSelect = (value: string) => {
    const newSelection = [value];
    setSelected(newSelection);
    handleSave(newSelection);
  };

  const handleMultipleSelect = (value: string) => {
    const newSelection = selected.includes(value)
      ? selected.filter((v: string) => v !== value)
      : [...selected, value];
    setSelected(newSelection);
    handleSave(newSelection);
  };

  const handlePrev = () => {
    if (prevProblem) {
      router.push(`/attempt/test/${params.testid}/question/${prevProblem.id}`);
    }
  };

  const handleNext = () => {
    if (nextProblem) {
      router.push(`/attempt/test/${params.testid}/question/${nextProblem.id}`);
    } else {
      // If "Finish", we can trigger the global submit if desired, 
      // but usually the Submit button in Header handles final endTest.
      toast.success("All questions completed! Click Submit to finish the test.");
    }
  };

  const isMultiple = problem.questionType === "Multiple Correct";

  return (
    <div className="h-full bg-background p-4 flex justify-center items-center overflow-hidden">
      <Card className="border-border bg-card shadow-lg w-full max-w-3xl h-[90vh]">
        <div className="flex items-center gap-3 px-6 h-14 border-b border-border">
          <Badge variant="secondary" className="capitalize px-3 py-1">
            {problem.difficulty}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">
            {problem.marks} Points
          </span>
          {isSaving && <span className="text-xs text-muted-foreground animate-pulse ml-auto">Saving...</span>}
        </div>
        <ScrollArea className="min-h-0 px-6 h-[calc(90vh-7rem)] flex-1">
          <div className="py-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-xl font-semibold text-foreground text-start">
                {problem.title}
              </h1>
              {/* Question Type */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  {isMultiple ? "Multiple Choice" : "Single Choice"}
                </span>
              </div>
              {/* Description */}
              <p className="mt-4 text-foreground/80 leading-relaxed">
                {problem.description}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isMultiple ? (
                <RadioGroup
                  value={selected[0]}
                  onValueChange={handleSingleSelect}
                  className="contents"
                >
                  {problem.options.map((opt, index) => {
                    const optId = `opt-${index}`;
                    const optValue = opt;
                    return (
                      <div key={optId} className="h-full">
                        <label
                          htmlFor={optId}
                          className={`
                          group block w-full h-full border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                          ${selected.includes(optValue)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }
                        `}
                        >
                          <div className="flex items-center gap-3 h-full">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium shrink-0 group-hover:bg-primary/10 transition-colors">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <RadioGroupItem
                              value={optValue}
                              id={optId}
                              className="shrink-0"
                            />
                            <span className="text-base font-medium flex-1 min-w-0 text-foreground">
                              {optValue}
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                <>
                  {problem.options.map((opt, index) => {
                    const optId = `opt-${index}`;
                    const optValue = opt;
                    return (
                      <div key={optId} className="h-full">
                        <label
                          htmlFor={optId}
                          className={`
                          group block w-full h-full border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                          ${selected.includes(optValue)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }
                        `}
                        >
                          <div className="flex items-center gap-3 h-full">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium shrink-0 group-hover:bg-primary/10 transition-colors">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <Checkbox
                              id={optId}
                              checked={selected.includes(optValue)}
                              onCheckedChange={() => handleMultipleSelect(optValue)}
                              className="shrink-0"
                            />
                            <span className="text-base font-medium flex-1 min-w-0 text-foreground">
                              {optValue}
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Navigation Buttons */}
        <div className="h-14 border-t border-border flex items-center justify-between px-6 bg-muted/20">
          <Button
            variant="outline"
            className="px-6 font-medium"
            onClick={handlePrev}
            disabled={!prevProblem}
          >
            Prev
          </Button>
          <Button
            className="px-6 font-medium"
            onClick={handleNext}
          >
            {nextProblem ? "Next" : "Finish"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
