"use client";

interface Props {
  onMigrate: () => void;
  onDismiss: () => void;
  syncing: boolean;
}

export default function MigrationBanner({ onMigrate, onDismiss, syncing }: Props) {
  return (
    <div className="mx-4 mt-4 px-4 py-3.5 bg-gb-yellow2/10 border border-gb-yellow2/40 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <div className="text-gb-yellow font-semibold text-sm mb-0.5">📱 Local data found</div>
        <div className="text-gb-fg2 text-xs leading-relaxed">
          You have gear data saved on this device. Upload it to the cloud so it syncs across all your devices.
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onMigrate}
          disabled={syncing}
          className="px-4 py-2 rounded-xl bg-gb-yellow2 text-gb-bg text-xs font-semibold hover:bg-gb-yellow transition-colors disabled:opacity-50"
        >
          {syncing ? "Uploading…" : "Upload to cloud"}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 rounded-xl border border-gb-border text-gb-faint text-xs hover:text-gb-muted transition-colors"
        >
          Keep local
        </button>
      </div>
    </div>
  );
}
