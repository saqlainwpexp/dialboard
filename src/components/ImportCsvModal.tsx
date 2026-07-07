"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";

const TARGET_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "company", label: "Company" },
  { key: "title", label: "Title" },
  { key: "email", label: "Email" },
  { key: "source", label: "Source" },
  { key: "industry", label: "Industry" },
  { key: "timezone", label: "Timezone" },
];

type CampaignOption = { _id: string; name: string };

export function ImportCsvModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaign, setCampaign] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/campaigns")
        .then((r) => r.json())
        .then((d) => setCampaigns(d.campaigns ?? []));
      setHeaders([]);
      setRows([]);
      setMapping({});
      setFileName("");
      setResult(null);
      setError("");
      setCampaign("");
    }
  }, [open]);

  function guessMapping(cols: string[]) {
    const guess: Record<string, string> = {};
    for (const field of TARGET_FIELDS) {
      const match = cols.find((c) => c.toLowerCase().replace(/[^a-z]/g, "") === field.key);
      if (match) guess[field.key] = match;
    }
    return guess;
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setError("");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? [];
        setHeaders(cols);
        setRows(results.data);
        setMapping(guessMapping(cols));
      },
    });
  }

  async function handleImport() {
    if (!mapping.name || !mapping.phone) {
      setError("Map both Name and Phone columns before importing.");
      return;
    }
    setSubmitting(true);
    setError("");

    const mappedRows = rows.map((row) => {
      const out: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const col = mapping[field.key];
        if (col) out[field.key] = row[col] ?? "";
      }
      return out;
    });

    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: mappedRows, campaign: campaign || null }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed.");
      return;
    }
    setResult(data);
    onImported();
  }

  return (
    <Modal open={open} onClose={onClose} title="Import leads from CSV" width="max-w-2xl">
      {!headers.length && (
        <div>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-10 cursor-pointer hover:bg-background transition">
            <span className="text-sm font-semibold text-foreground">Click to choose a CSV file</span>
            <span className="text-xs text-muted-2">Exported from Apollo, LinkedIn, ZoomInfo, etc.</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {headers.length > 0 && !result && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">{fileName}</span> — {rows.length} rows detected.
            Map your columns below.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {TARGET_FIELDS.map((field) => (
              <Field key={field.key} label={field.label + (field.required ? " *" : "")}>
                <select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>

          <Field label="Assign to campaign (optional)">
            <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleImport}
            disabled={submitting}
            className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Importing…" : `Import ${rows.length} leads`}
          </button>
        </div>
      )}

      {result && (
        <div className="text-center py-6">
          <p className="text-lg font-bold text-foreground">
            Imported {result.imported} lead{result.imported === 1 ? "" : "s"}
          </p>
          {result.skipped > 0 && (
            <p className="text-sm text-muted mt-1">{result.skipped} rows skipped (missing name/phone).</p>
          )}
          <button
            onClick={onClose}
            className="mt-4 rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 px-6 hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
