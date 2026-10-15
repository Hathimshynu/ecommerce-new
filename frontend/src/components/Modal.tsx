"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  dismissible = true,
  size = "max-w-lg",
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  size?: string;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => dismissible && e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => dismissible && onClose?.()}>
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full ${size} overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || dismissible) && (
          <div className="mb-4 flex items-center justify-between gap-4">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {dismissible && (
              <button onClick={onClose} aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-full hover:bg-slate-100">
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
