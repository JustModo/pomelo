"use client";
import React, { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CodeEditorPanel from "./code-editor";
import DescriptionPanel from "./description";
import TestCasePanel from "./test-case";
import { CodingProblem } from "@/types/problem";

export function CodeScreen({ problem }: { problem: CodingProblem }) {
  const availableLanguages = Object.keys(problem.boilerplateCode || {}) as Array<keyof typeof problem.boilerplateCode>;
  const initialCode = problem.savedCode
    || (problem.boilerplateCode && availableLanguages.length > 0 ? (problem.boilerplateCode[availableLanguages[0]] || "") : "// Start coding here");
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(availableLanguages.length > 0 ? String(availableLanguages[0]) : "javascript");
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-full border"
    >
      <ResizablePanel defaultSize={30} minSize={4}>
        <div className="flex h-full w-full">
          <DescriptionPanel problem={problem} />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={70} minSize={20}>
        <ResizablePanelGroup direction="vertical" className="h-full w-full">
          <ResizablePanel defaultSize={55} minSize={6}>
            <div className="flex h-full w-full ">
              <CodeEditorPanel
                problem={problem}
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={45} minSize={6}>
            <div className="flex h-full w-full">
              <TestCasePanel
                problem={problem}
                code={code}
                language={language}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
