import Groq from "groq-sdk";
import { buildVerifyPrompt, parseVerdictJson, type Verdict, type VerifyTaskContext } from "./types";

// created on first use so a missing key can't break the build
let client: Groq | null = null;
function getClient(): Groq {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export async function verifyWithGroq(
  imageBase64: string,
  mimeType: string,
  task: VerifyTaskContext,
): Promise<Verdict> {
  const completion = await getClient().chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildVerifyPrompt(task) },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = parseVerdictJson(raw);
  return { ...parsed, provider: "groq" };
}
