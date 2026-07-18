/**
 * In-page actions row (page title lives in PageRibbon).
 */
export default function PageHeader({ eyebrow, description, actions, className = '' }) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-biz-muted dark:text-slate-400">
            {eyebrow}
          </p>
        )}
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
