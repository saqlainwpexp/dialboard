"use client";

import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative bg-surface rounded-3xl card-shadow p-6 w-full ${width} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
