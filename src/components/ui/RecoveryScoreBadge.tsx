export default function RecoveryScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score < 75) {
    colorClass = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (score < 85) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <span className={`inline-flex items-center font-bold px-2.5 py-1 rounded-lg border text-xs ${colorClass}`}>
      {score}/100
    </span>
  );
}
