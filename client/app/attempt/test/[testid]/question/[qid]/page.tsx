import { auth } from "@/auth";
import { CodeScreen } from "@/components/attempt/code";
import React from "react";
import { CodingProblem, MCQProblem, Problem } from "@/types/problem";
import MCQScreen from "@/components/attempt/mcq";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    testid: string;
    qid: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TestContentPage(props: Props) {
  const params = await props.params;
  const { testid, qid } = params;
  const session = await auth();

  // Fetch contest data via student API
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/test/${testid}/data`, {
    headers: {
      "Authorization": `Bearer ${session?.backendToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const result = await res.json();
  if (!result.success) {
    return notFound();
  }

  const allProblems = (result.data?.problems || []) as Problem[];
  const currentProblem = allProblems.find(p => String(p.id) === qid);

  if (!currentProblem) {
    return notFound();
  }

  return (
    <div className="w-full h-full">
      {currentProblem.type.toLowerCase() === "coding" ? (
        <CodeScreen problem={currentProblem as CodingProblem} />
      ) : (
        <MCQScreen
          problem={currentProblem as MCQProblem}
          problems={allProblems}
        />
      )}
    </div>
  );
}
