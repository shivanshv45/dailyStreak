import { GoogleGenAI } from "@google/genai";
import { buildVerifyPrompt, parseVerdictJson, type Verdict, type VerifyTaskContext } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function verifyWithGemini(
  imageBase64: string,
  mimeType: string,
  task: VerifyTaskContext,
): Promise<Verdict> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
      {
        role: "user",
        parts: [
          { text: buildVerifyPrompt(task) },
          { inlineData: { data: imageBase64, mimeType } },
        ],
      },
    ],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text ?? "";
  const parsed = parseVerdictJson(raw);
  return { ...parsed, provider: "gemini" };
}
