"use client";

import { useState, useSyncExternalStore } from "react";
import { updateTimezone } from "./actions";

const noop = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || null;

export function TimezoneField({ saved, zones }: { saved: string; zones: string[] }) {
  const detected = useSyncExternalStore(noop, browserZone, () => null);
  const [picked, setPicked] = useState<string | null>(null);

  const value = picked ?? detected ?? saved;
  const options = [value, saved, ...zones].filter((z, i, all) => all.indexOf(z) === i);
  const dirty = value !== saved;

  return (
    <form action={updateTimezone} className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <select name="timezone" value={value} onChange={(e) => setPicked(e.target.value)} className="input py-2 text-sm">
          {options.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!dirty} className="btn-ink shrink-0 px-4 py-2">
          Save
        </button>
      </div>
      {detected && (
        <p className="text-xs text-muted">
          {value === detected ? "Detected from your browser" : (
            <button type="button" onClick={() => setPicked(detected)} className="underline decoration-pink decoration-2 underline-offset-2">
              Use detected: {detected.replaceAll("_", " ")}
            </button>
          )}
          {!dirty && value === detected && <span className="ml-1 text-faint">· saved</span>}
        </p>
      )}
    </form>
  );
}
