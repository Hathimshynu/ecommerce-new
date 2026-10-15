import { Loader2 } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <Loader2 className="size-7 animate-spin text-brand-600" />
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="card p-10 text-center text-sm text-muted">{text}</div>;
}

export function Pager({ page, last, onChange }: { page: number; last: number; onChange: (p: number) => void }) {
  if (last <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button className="btn-secondary !px-3 !py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      <span className="text-sm text-muted">Page {page} of {last}</span>
      <button className="btn-secondary !px-3 !py-1.5" disabled={page >= last} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
