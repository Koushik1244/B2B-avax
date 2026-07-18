import { useState } from 'react';
import api from '../services/api';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

const DECISION_STYLES = {
  SEND: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ESCALATE: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  SUPPRESS: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  DELAY: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
};

const LANGUAGES = ['Hinglish', 'English', 'Hindi', 'Marathi', 'Tamil'];

export default function Reminders() {
  const [language, setLanguage] = useState('English');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [delayedIds, setDelayedIds] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState(null);

  const runReminders = async () => {
    setRunning(true);
    setError('');
    setResults(null);
    try {
      const { data } = await api.post('/reminders/evaluate-all', { language });
      setResults(data);
      localStorage.setItem('lastReminderRun', Date.now().toString());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run reminders');
    } finally {
      setRunning(false);
    }
  };

  const visible = results?.filter((r) => !delayedIds.has(r.invoiceId)) ?? [];

  const handleSend = async (r) => {
    const text = r.message || r.reason || '';
    if (!text) {
      window.alert('No message for this row. Decision may be SUPPRESS or DELAY.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(r.invoiceId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.alert(text);
    }
  };

  const handleDelay = (id) => {
    setDelayedIds((prev) => new Set([...prev, id]));
  };

  const handleEscalate = async (r) => {
    const base = r.message || `Reminder: Invoice ${r.invoiceNumber} — ₹${r.invoice?.total?.toLocaleString('en-IN')}`;
    const text = `URGENT — ${base}`;
    try {
      await navigator.clipboard.writeText(text);
      window.alert('Escalation text copied to clipboard.');
    } catch {
      window.alert(text);
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Automation"
        description="Batch-evaluate unpaid invoices, then copy AI messages for WhatsApp or email."
      />
      <BizCard className="mb-6" title="Reminder engine" subtitle="Language and evaluation controls">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Message language
            </p>
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded border px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                    language === lang
                      ? 'border-blue-800 bg-blue-800 text-white dark:border-blue-600 dark:bg-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={runReminders}
            disabled={running}
            className="rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
          >
            {running ? 'Evaluating…' : 'Run evaluation'}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800 md:grid-cols-4">
          {[
            ['SEND', 'Eligible to send'],
            ['ESCALATE', 'Overdue emphasis'],
            ['DELAY', 'Quiet hours / timing'],
            ['SUPPRESS', 'Paid or recent ping'],
          ].map(([k, d]) => (
            <div key={k}>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{k}</span>
              <p className="text-slate-500 dark:text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </BizCard>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {!results && !running && (
        <BizCard title="Queue" subtitle="Waiting for evaluation">
          <p className="py-8 text-center text-sm text-slate-500">
            Run evaluation to populate the queue. Each card shows the AI decision and message preview.
          </p>
        </BizCard>
      )}

      {results && (
        <BizCard
          title={`Queue · ${visible.length} item${visible.length !== 1 ? 's' : ''}`}
          subtitle={delayedIds.size > 0 ? `${delayedIds.size} snoozed this session` : 'Priority by decision type'}
        >
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No rows to show. All snoozed or no unpaid invoices.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {visible.map((r) => (
                <div
                  key={r.invoiceId}
                  className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-md ring-1 ring-slate-200/70 dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-slate-500">{r.invoiceNumber}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${DECISION_STYLES[r.decision] || DECISION_STYLES.SUPPRESS}`}
                    >
                      {r.decision}
                    </span>
                  </div>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">{r.customer?.name}</p>
                  {r.customer?.businessName && <p className="text-xs text-slate-500">{r.customer.businessName}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    Due{' '}
                    {r.invoice?.dueDate ? new Date(r.invoice.dueDate).toLocaleDateString('en-IN') : '—'}
                  </p>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400" title={r.message || r.reason}>
                    {r.message || r.reason || '—'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSend(r)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {copiedId === r.invoiceId ? 'Copied' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelay(r.invoiceId)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Delay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEscalate(r)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BizCard>
      )}
    </main>
  );
}
