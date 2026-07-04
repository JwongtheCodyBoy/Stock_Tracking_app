import type { ChangeEvent } from "react";
import type { StockProfile } from "../types/stocks";

interface ProfileToolbarProps {
  profiles: StockProfile[];
  activeProfileId: string;
  apiKey: string;
  interval: string;
  outputSize: number;
  isRefreshing: boolean;
  onProfileChange: (profileId: string) => void;
  onProfileNameChange: (name: string) => void;
  onCreateProfile: () => void;
  onDeleteProfile: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onIntervalChange: (interval: "1day" | "1h" | "15min" | "5min" | "1min") => void;
  onOutputSizeChange: (outputSize: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ProfileToolbar({
  profiles,
  activeProfileId,
  apiKey,
  interval,
  outputSize,
  isRefreshing,
  onProfileChange,
  onProfileNameChange,
  onCreateProfile,
  onDeleteProfile,
  onApiKeyChange,
  onIntervalChange,
  onOutputSizeChange,
  onRefresh,
  onExport,
  onImport
}: ProfileToolbarProps) {
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = "";
    }
  }

  return (
    <section className="tool-panel">
      <div className="panel-header">
        <h2>Profile</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onCreateProfile}>
            New
          </button>
          <button className="btn btn-outline-danger btn-sm" type="button" onClick={onDeleteProfile} disabled={profiles.length <= 1}>
            Delete
          </button>
        </div>
      </div>

      <div className="row g-3 align-items-end">
        <div className="col-lg-3 col-md-6">
          <label className="form-label" htmlFor="profile-select">
            Load profile
          </label>
          <select id="profile-select" className="form-select" value={activeProfileId} onChange={(event) => onProfileChange(event.target.value)}>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-lg-3 col-md-6">
          <label className="form-label" htmlFor="profile-name">
            Profile name
          </label>
          <input
            id="profile-name"
            className="form-control"
            value={activeProfile?.name ?? ""}
            onChange={(event) => onProfileNameChange(event.target.value)}
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <label className="form-label" htmlFor="api-key">
            Twelve Data API key
          </label>
          <input
            id="api-key"
            className="form-control"
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="Stored in this browser"
          />
        </div>

        <div className="col-lg-1 col-md-3">
          <label className="form-label" htmlFor="interval">
            Interval
          </label>
          <select
            id="interval"
            className="form-select"
            value={interval}
            onChange={(event) => onIntervalChange(event.target.value as "1day" | "1h" | "15min" | "5min" | "1min")}
          >
            <option value="1day">1 day</option>
            <option value="1h">1 hour</option>
            <option value="15min">15 min</option>
            <option value="5min">5 min</option>
            <option value="1min">1 min</option>
          </select>
        </div>

        <div className="col-lg-2 col-md-3">
          <label className="form-label" htmlFor="output-size">
            Bars
          </label>
          <input
            id="output-size"
            className="form-control"
            type="number"
            min="40"
            max="500"
            value={outputSize}
            onChange={(event) => onOutputSizeChange(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <button className="btn btn-success" type="button" onClick={onRefresh} disabled={isRefreshing || !apiKey.trim()}>
          {isRefreshing ? "Updating..." : "Update Up To 8 Stocks"}
        </button>
        <button className="btn btn-outline-secondary" type="button" onClick={onExport}>
          Export JSON
        </button>
        <label className="btn btn-outline-secondary mb-0" htmlFor="profile-import">
          Import JSON
        </label>
        <input id="profile-import" className="visually-hidden" type="file" accept="application/json,.json" onChange={handleFileChange} />
      </div>
    </section>
  );
}
