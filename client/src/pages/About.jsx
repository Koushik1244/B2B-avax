import { Link } from 'react-router-dom';
import {
  HiCheckCircle,
  HiBellSlash,
  HiMoon,
  HiExclamationTriangle,
  HiPaperAirplane,
  HiDocumentText,
} from 'react-icons/hi2';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

const rules = [
  {
    Icon: HiCheckCircle,
    iconClass: 'text-slate-500 dark:text-slate-400',
    decision: 'SUPPRESS',
    color:
      'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    rule: 'Invoice already paid — no reminder needed.',
  },
  {
    Icon: HiBellSlash,
    iconClass: 'text-slate-500 dark:text-slate-400',
    decision: 'SUPPRESS',
    color:
      'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
    rule: 'Reminder sent within last 48 hours — avoid spamming the customer.',
  },
  {
    Icon: HiMoon,
    iconClass: 'text-amber-600 dark:text-amber-400',
    decision: 'DELAY',
    color:
      'text-amber-900 bg-amber-100 dark:text-amber-100 dark:bg-amber-950/50',
    rule: 'Current time is between 10pm–7am — schedule reminder for next 9am.',
  },
  {
    Icon: HiExclamationTriangle,
    iconClass: 'text-red-600 dark:text-red-400',
    decision: 'ESCALATE',
    color: 'text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-950/50',
    rule: 'Invoice overdue by more than 7 days — escalate tone via AI.',
  },
  {
    Icon: HiPaperAirplane,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    decision: 'SEND',
    color:
      'text-emerald-900 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-950/40',
    rule: 'None of the above — send a polite reminder now.',
  },
];

const stack = [
  { layer: 'Frontend', tech: 'React + Vite + TailwindCSS' },
  { layer: 'Backend', tech: 'Node.js + Express' },
  { layer: 'Database', tech: 'MongoDB Atlas + Mongoose' },
  { layer: 'AI Engine', tech: 'Google Gemini 1.5 Flash API' },
  { layer: 'Auth', tech: 'JWT + bcrypt' },
];

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <PageHeader
        eyebrow="Product story"
        description="Why timing and tone matter for Indian SMB collections."
      />

      <div className="mb-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-biz-accent to-indigo-700 text-white shadow-lg shadow-biz-accent/25 dark:from-cyan-500 dark:to-blue-700">
          <HiDocumentText className="h-10 w-10" aria-hidden />
        </div>
        <h1 className="mb-3 mt-5 text-3xl font-bold tracking-tight text-biz-navy dark:text-white">
          Smart Invoicing Assistant
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Small businesses lose money not because customers will not pay — but because reminders are sent at the wrong time, in the
          wrong tone, or not at all.
        </p>
      </div>

      <BizCard className="mb-8" title="How the AI context engine works" subtitle="First matching rule wins">
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
          Before sending any reminder, the engine evaluates five rules in order.
        </p>
        <div className="space-y-3">
          {rules.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-800/40 dark:ring-slate-700"
            >
              <div className="mt-0.5 shrink-0">
                <r.Icon className={`h-6 w-6 ${r.iconClass}`} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{r.rule}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${r.color}`}>{r.decision}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          For SEND and ESCALATE decisions, Gemini 1.5 Flash generates a human-sounding Hinglish WhatsApp message tailored to the
          customer and invoice context.
        </p>
      </BizCard>

      <BizCard className="mb-8" title="Tech stack" hover={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stack.map(({ layer, tech }, i) => (
            <div key={i} className="flex items-center py-3 text-sm first:pt-0 last:pb-0">
              <span className="w-28 shrink-0 font-semibold text-biz-muted dark:text-slate-500">{layer}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{tech}</span>
            </div>
          ))}
        </div>
      </BizCard>

      <BizCard
        title="Demo login"
        subtitle="For judges and walkthroughs"
        className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white dark:border-indigo-900 dark:from-indigo-950/40 dark:to-biz-slate"
        hover={false}
      >
        <div className="space-y-1 font-mono text-sm text-indigo-900 dark:text-indigo-200">
          <p>Email: demo@kirana.com</p>
          <p>Password: demo1234</p>
        </div>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md dark:from-cyan-600 dark:to-blue-600"
        >
          Back to dashboard
        </Link>
      </BizCard>
    </main>
  );
}
