import { STATUS_STYLES } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge capitalize ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}
