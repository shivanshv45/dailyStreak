export type Verdict = {
  verdict: "pass" | "fail";
  confidence: number;
  reason: string;
  provider: "groq" | "gemini";
};

export type VerifyTaskContext = {
  title: string;
  description: string | null;
  doneCriteria: string | null;
};

export function buildVerifyPrompt(task: VerifyTaskContext): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are verifying whether a screenshot proves someone completed their daily task.

Task title: ${task.title}
Task description: ${task.description ?? "(none)"}
What counts as done: ${task.doneCriteria ?? "(not specified — judge plausibility from the title and description)"}
Today's date: ${today}

Rules:
- Reject images that are blank, unrelated, or generic/stock screenshots with no connection to the task.
- If the screenshot shows a visible date that is clearly not today, fail it.
- If "what counts as done" is specified, the screenshot must satisfy it.
- If not specified, judge plausibility from the title and description alone.

Respond with ONLY strict JSON, no markdown, no commentary:
{"verdict": "pass" | "fail", "confidence": number between 0 and 1, "reason": "one short sentence"}`;
}

export function parseVerdictJson(raw: string): Omit<Verdict, "provider"> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in model response");
  const parsed = JSON.parse(match[0]);
  if (parsed.verdict !== "pass" && parsed.verdict !== "fail") {
    throw new Error("Invalid verdict value");
  }
  return {
    verdict: parsed.verdict,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    reason: typeof parsed.reason === "string" ? parsed.reason : "",
  };
}
