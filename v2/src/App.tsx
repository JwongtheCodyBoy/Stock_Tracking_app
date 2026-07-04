import { useEffect, useMemo, useState } from "react";
import { refreshStockSnapshots, type RefreshOptions } from "./api/twelveDataApi";
import { AddStockForm } from "./components/AddStockForm";
import { ProfileToolbar } from "./components/ProfileToolbar";
import { StockGrid } from "./components/StockGrid";
import type { StockSignalSnapshot } from "./types/conditions";
import type { StockProfile, TrackedStock } from "./types/stocks";
import { buildExport, createStarterProfile, downloadJson, loadProfiles, parseProfileImport, saveProfiles } from "./storage/profileStorage";

const apiKeyStorageKey = "stock-tracker-v2-twelve-data-api-key";

export default function App() {
  const [profiles, setProfiles] = useState<StockProfile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileId] = useState(() => loadProfiles()[0]?.id ?? "");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(apiKeyStorageKey) ?? "");
  const [interval, setInterval] = useState<RefreshOptions["interval"]>("1day");
  const [outputSize, setOutputSize] = useState(120);
  const [snapshots, setSnapshots] = useState<Record<string, StockSignalSnapshot>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
    [activeProfileId, profiles]
  );

  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(apiKeyStorageKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (activeProfile && activeProfile.id !== activeProfileId) {
      setActiveProfileId(activeProfile.id);
    }
  }, [activeProfile, activeProfileId]);

  function updateActiveProfile(updater: (profile: StockProfile) => StockProfile) {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activeProfile?.id
          ? {
              ...updater(profile),
              updatedAtUtc: new Date().toISOString()
            }
          : profile
      )
    );
  }

  function handleAddStock(stock: TrackedStock) {
    updateActiveProfile((profile) => ({
      ...profile,
      stocks: [...profile.stocks, stock]
    }));
    setMessage(null);
  }

  function handleRemoveStock(stockId: string) {
    updateActiveProfile((profile) => ({
      ...profile,
      stocks: profile.stocks.filter((stock) => stock.id !== stockId)
    }));
    setSnapshots((current) => {
      const next = { ...current };
      delete next[stockId];
      return next;
    });
  }

  function handleCreateProfile() {
    const profile = createStarterProfile();
    profile.name = `Watchlist ${profiles.length + 1}`;
    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);
    setSnapshots({});
  }

  function handleDeleteProfile() {
    if (!activeProfile || profiles.length <= 1) {
      return;
    }

    const remainingProfiles = profiles.filter((profile) => profile.id !== activeProfile.id);
    setProfiles(remainingProfiles);
    setActiveProfileId(remainingProfiles[0].id);
    setSnapshots({});
  }

  async function handleRefresh() {
    if (!activeProfile || !apiKey.trim()) {
      return;
    }

    setIsRefreshing(true);
    setMessage(null);

    const refreshedSnapshots = await refreshStockSnapshots(activeProfile.stocks, {
      apiKey: apiKey.trim(),
      interval,
      outputSize
    });

    setSnapshots((current) => ({ ...current, ...refreshedSnapshots }));
    setIsRefreshing(false);

    const skippedCount = Math.max(activeProfile.stocks.length - 8, 0);
    setMessage(skippedCount > 0 ? `Updated 8 stocks. ${skippedCount} skipped to stay inside the free-tier call budget.` : "Update complete.");
  }

  function handleExport() {
    downloadJson("stock-tracker-v2-profiles.json", buildExport(profiles));
  }

  async function handleImport(file: File) {
    try {
      const importedProfiles = parseProfileImport(await file.text());
      setProfiles(importedProfiles);
      setActiveProfileId(importedProfiles[0].id);
      setSnapshots({});
      setMessage("Profiles imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    }
  }

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg app-nav">
        <div className="container">
          <span className="navbar-brand fw-bold">Stock Tracker v2</span>
          <span className="navbar-text">Manual refresh, local profiles, frontend only</span>
        </div>
      </nav>

      <main className="container py-4">
        <ProfileToolbar
          profiles={profiles}
          activeProfileId={activeProfile?.id ?? ""}
          apiKey={apiKey}
          interval={interval}
          outputSize={outputSize}
          isRefreshing={isRefreshing}
          onProfileChange={(profileId) => {
            setActiveProfileId(profileId);
            setSnapshots({});
          }}
          onProfileNameChange={(name) => updateActiveProfile((profile) => ({ ...profile, name }))}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
          onApiKeyChange={setApiKey}
          onIntervalChange={setInterval}
          onOutputSizeChange={(value) => setOutputSize(Number.isFinite(value) ? value : 120)}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onImport={handleImport}
        />

        {message && <div className="alert alert-info">{message}</div>}

        <AddStockForm onAddStock={handleAddStock} disabled={!activeProfile} />

        {activeProfile && activeProfile.stocks.length > 8 && (
          <div className="alert alert-secondary">This profile has {activeProfile.stocks.length} stocks. Each manual update refreshes the first 8.</div>
        )}

        <StockGrid stocks={activeProfile?.stocks ?? []} snapshots={snapshots} onRemove={handleRemoveStock} />
      </main>
    </div>
  );
}
