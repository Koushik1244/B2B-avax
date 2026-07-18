const accents = {
  default: 'border-l-4 border-l-biz-accent dark:border-l-cyan-400',
  success: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
  warning: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
  danger: 'border-l-4 border-l-red-500 dark:border-l-red-400',
  violet: 'border-l-4 border-l-violet-500 dark:border-l-violet-400',
};

/**
 * KPI tile with left accent bar — pairs with dashboard / analytics grids.
 */
export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'default',
  className = '',
}) {
  const border = accents[accent] || accents.default;
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 px-5 py-4 shadow-md ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:from-slate-900 dark:to-biz-slate/80 dark:ring-slate-700/60 ${border} border-l-4 transition-all duration-300 hover:shadow-lg ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-biz-muted dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-biz-navy dark:text-white sm:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-biz-accent/10 text-biz-accent dark:bg-cyan-500/15 dark:text-cyan-300">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
