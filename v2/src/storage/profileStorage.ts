import type { ExportedStockProfiles, StockProfile } from "../types/stocks";
import { createId } from "../utils/id";

const storageKey = "stock-tracker-v2-profiles";

export function createStarterProfile(): StockProfile {
  return {
    id: createId("profile"),
    name: "Default watchlist",
    stocks: [],
    updatedAtUtc: new Date().toISOString()
  };
}

export function loadProfiles(): StockProfile[] {
  const rawValue = localStorage.getItem(storageKey);
  if (!rawValue) {
    return [createStarterProfile()];
  }

  try {
    const parsed = JSON.parse(rawValue) as StockProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createStarterProfile()];
    }

    return parsed;
  } catch {
    return [createStarterProfile()];
  }
}

export function saveProfiles(profiles: StockProfile[]) {
  localStorage.setItem(storageKey, JSON.stringify(profiles));
}

export function buildExport(profiles: StockProfile[]): ExportedStockProfiles {
  return {
    app: "stock-tracker-v2",
    version: 1,
    exportedAtUtc: new Date().toISOString(),
    profiles
  };
}

export function parseProfileImport(rawValue: string): StockProfile[] {
  const parsed = JSON.parse(rawValue) as ExportedStockProfiles | StockProfile[];
  const profiles = Array.isArray(parsed) ? parsed : parsed.profiles;

  if (!Array.isArray(profiles) || profiles.length === 0) {
    throw new Error("The imported JSON does not contain any profiles.");
  }

  profiles.forEach((profile) => {
    if (!profile.id || !profile.name || !Array.isArray(profile.stocks)) {
      throw new Error("The imported JSON is not a valid stock profile export.");
    }
  });

  return profiles.map((profile) => ({
    ...profile,
    updatedAtUtc: new Date().toISOString()
  }));
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
