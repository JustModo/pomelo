"use server";

import { fetchBackend } from "@/lib/fetch";

export async function joinTest(joinId: string) {
  return fetchBackend("/api/test/join", {
    method: "POST",
    body: JSON.stringify({ joinId }),
  });
}

export async function getContestLanding(contestId: string) {
  return fetchBackend(`/api/test/${contestId}`);
}

export async function startTest(contestId: string) {
  return fetchBackend("/api/test/start", {
    method: "POST",
    body: JSON.stringify({ contestId }),
  });
}

export async function getContestData(contestId: string) {
  return fetchBackend(`/api/test/${contestId}/data`);
}

export async function endTest(contestId: string, forcedSubmission?: boolean, autoSubmitReason?: string) {
  return fetchBackend(`/api/test/${contestId}/end`, {
    method: "POST",
    body: JSON.stringify({ contestId, forcedSubmission, autoSubmitReason }),
  });
}

export async function submitMcq(contestId: string, questionId: string, answer: any) {
  return fetchBackend(`/api/test/${contestId}/mcq`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}

export async function runCode(contestId: string, questionId: string, code: string, language: string) {
  return fetchBackend(`/api/test/${contestId}/run`, {
    method: "POST",
    body: JSON.stringify({ 
      questionId, 
      code: Buffer.from(code).toString('base64'), 
      language, 
      isBase64: true 
    }),
  });
}

export async function submitCode(contestId: string, questionId: string, code: string, language: string) {
  return fetchBackend(`/api/test/${contestId}/submit`, {
    method: "POST",
    body: JSON.stringify({ 
      contestId, 
      questionId, 
      code: Buffer.from(code).toString('base64'), 
      language, 
      isBase64: true 
    }),
  });
}
