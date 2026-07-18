// Kept for backward compatibility — main Reminder UI is now in pages/Reminders.jsx
const BADGE = {
  SEND:     { bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400', label: 'SEND' },
  ESCALATE: { bg: 'bg-red-500/15 text-red-400 border border-red-500/30',             dot: 'bg-red-400',     label: 'ESCALATE' },
  SUPPRESS: { bg: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',          dot: 'bg-gray-400',    label: 'SUPPRESS' },
  DELAY:    { bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',       dot: 'bg-amber-400',   label: 'DELAY' },
};

const CARD_BG = {
  SEND:     'bg-[#0d1a0f] border-emerald-900/40',
  ESCALATE: 'bg-[#1a0d0d] border-red-900/40',
  SUPPRESS: 'bg-[#161616] border-[#2a2a2a]',
  DELAY:    'bg-[#1a1600] border-amber-900/40',
};

export default function ReminderResultCard({ result }) {
  const { decision, reason, message, customer, invoice, nextSendTime, daysOverdue } = result;
  const badge = BADGE[decision] || BADGE.SUPPRESS;
  const cardBg = CARD_BG[decision] || CARD_BG.SUPPRESS;

  return (
    <div className={`rounded-2xl border p-5 transition-all ${cardBg}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-white text-sm">{customer?.name}</p>
          {customer?.businessName && <p className="text-xs text-gray-500 mt-0.5">{customer.businessName}</p>}
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shrink-0 ${badge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
        <span>Invoice: <span className="font-mono text-gray-300">{result.invoiceNumber}</span></span>
        <span>Amount: <span className="font-semibold text-white">₹{invoice?.total?.toLocaleString('en-IN')}</span></span>
        {daysOverdue > 0 && <span className="text-red-400 font-medium">{daysOverdue}d overdue</span>}
      </div>

      <p className="text-xs text-gray-500 italic">{reason}</p>

      {nextSendTime && (
        <p className="text-xs text-amber-400 font-medium mt-1">
          Scheduled: {new Date(nextSendTime).toLocaleString('en-IN')}
        </p>
      )}

      {message && (
        <div className="mt-4 bg-[#0a1f0a] border border-emerald-900/50 rounded-xl px-4 py-3">
          <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1.5">AI Generated Message</p>
          <p className="text-sm text-emerald-100 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
      )}
    </div>
  );
}
