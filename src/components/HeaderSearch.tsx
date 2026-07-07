"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LeadRow } from "@/types";

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadRow[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults((data.leads ?? []).slice(0, 6));
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goTo(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/leads/${id}`);
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block w-64">
      <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2.5 card-shadow">
        <Search size={16} className="text-muted-2 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search leads by name, phone…"
          className="bg-transparent text-sm outline-none placeholder:text-muted-2 w-full"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-surface rounded-2xl card-shadow overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length === 0 && (
            <p className="text-sm text-muted-2 px-4 py-3">No leads match &quot;{query}&quot;</p>
          )}
          {results.map((lead) => (
            <button
              key={lead._id}
              onClick={() => goTo(lead._id)}
              className="w-full text-left px-4 py-2.5 hover:bg-background transition flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{lead.name}</div>
                <div className="text-xs text-muted truncate">
                  {lead.company}
                  {lead.company ? " · " : ""}
                  {lead.phone}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
