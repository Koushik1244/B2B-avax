/**
 * Rounded elevated surface — use for panels, chart shells, and list sections.
 */
export default function BizCard({
  children,
  className = '',
  title,
  subtitle,
  actions,
  padding = true,
  hover = true,
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700/90 ${
        hover ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:ring-cyan-500/20' : ''
      } ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-biz-muted dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : undefined}>{children}</div>
    </div>
  );
}
