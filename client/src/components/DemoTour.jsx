import { useEffect } from 'react';

const STEPS = [
  {
    title: 'Navigation',
    body: 'Use the top bar: scroll the center links on mobile. Active routes are highlighted. AutoBiz keeps Dashboard, billing, analytics, and stock in one place.',
  },
  {
    title: 'Dashboard',
    body: 'Review invoice counts, payment trends, and customer health at a glance.',
  },
  {
    title: 'Invoices & collections',
    body: 'Filter the invoice register, export PDFs, and run AI reminder evaluation per row.',
  },
  {
    title: 'Reminders',
    body: 'Run batch evaluation, then copy messages for WhatsApp or email follow-up.',
  },
];

export default function DemoTour({ step, onNext, onPrev, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = STEPS[step];
  const last = step >= STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Guided demo · {step + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {s.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={onPrev}
                className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={last ? onClose : onNext}
              className="rounded border border-blue-800 bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white dark:border-blue-600 dark:bg-blue-600"
            >
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
