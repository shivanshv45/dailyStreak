import { verifyWithGroq } from "./groq";
import { verifyWithGemini } from "./gemini";
import type { Verdict, VerifyTaskContext } from "./types";

export type { Verdict, VerifyTaskContext };

export async function verifyProof(
  imageBase64: string,
  mimeType: string,
  task: VerifyTaskContext,
): Promise<Verdict> {
  try {
    return await verifyWithGroq(imageBase64, mimeType, task);
  } catch (groqError) {
    try {
      return await verifyWithGemini(imageBase64, mimeType, task);
    } catch (geminiError) {
      throw new AggregateError(
        [groqError, geminiError],
        "Both Groq and Gemini verification failed",
      );
    }
  }
}
