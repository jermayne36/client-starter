import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { RawHoaTicket } from "./types.js";

const CORPUS_PATH = fileURLToPath(
  new URL("../data/synthetic-hoa-tickets.json", import.meta.url),
);

export async function loadSyntheticCorpus(): Promise<RawHoaTicket[]> {
  const contents = await readFile(CORPUS_PATH, "utf8");
  const parsed: unknown = JSON.parse(contents);

  if (!Array.isArray(parsed)) {
    throw new Error("Synthetic HOA corpus must be a JSON array");
  }

  return parsed as RawHoaTicket[];
}
