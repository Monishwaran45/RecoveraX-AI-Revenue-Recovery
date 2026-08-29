export default function RecoveryScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (score < 70) {
    colorClass = "bg-rose-50 text-rose-800 border-rose-200";
  } else if (score < 85) {
    colorClass = "bg-amber-50 text-amber-800 border-amber-200";
  }

  return (
    <span className={`inline-flex items-center font-mono font-medium px-1.5 py-0.5 rounded border text-[11px] tabular-nums ${colorClass}`}>
      {score}/100
    </span>
  );
}
