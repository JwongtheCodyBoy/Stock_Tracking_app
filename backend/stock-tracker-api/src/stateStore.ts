import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppState } from "./types.js";

const defaultState: AppState = {
  settings: {
    darkMode: false
  },
  stocks: []
};

export class JsonStateStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<AppState> {
    try {
      const json = await readFile(this.filePath, "utf8");

      if (!json.trim()) {
        return structuredClone(defaultState);
      }

      return {
        ...structuredClone(defaultState),
        ...JSON.parse(json)
      };
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return structuredClone(defaultState);
      }

      throw error;
    }
  }

  async save(state: AppState): Promise<void> {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });

    const tempFile = `${this.filePath}.tmp`;
    await writeFile(tempFile, JSON.stringify(state, null, 2), "utf8");
    await rename(tempFile, this.filePath);
  }
}
