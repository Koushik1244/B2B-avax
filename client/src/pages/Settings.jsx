import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-800 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Section({ title, children }) {
  return (
    <BizCard className="mb-5" title={title} hover={false}>
      <div className="-m-5 divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </BizCard>
  );
}

function Row({ label, sub, right }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

const inputCls =
  'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500';

export default function Settings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    emailNotifs: true,
    smsNotifs: false,
    autoOverdue: true,
    weeklyReport: false,
  });
  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Configuration"
        description="Account, business profile, and notification preferences (demo toggles)."
      />

      <Section title="Account">
        <Row
          label={user?.name}
          sub={user?.email}
          right={
            <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          }
        />
        <Row
          label="Member since"
          sub="Demo account"
          right={<span className="text-xs text-slate-500">{new Date().getFullYear()}</span>}
        />
      </Section>

      <Section title="Business">
        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
          {[
            { label: 'Business name', placeholder: 'My Kirana Store', defaultVal: '' },
            { label: 'GST number', placeholder: '22AAAAA0000A1Z5', defaultVal: '' },
            { label: 'UPI ID', placeholder: 'business@upi', defaultVal: 'demo@kirana' },
            { label: 'Phone', placeholder: '9876543210', defaultVal: '' },
          ].map(({ label, placeholder, defaultVal }) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
              <input defaultValue={defaultVal} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <Row
          label="Email notifications"
          sub="Invoice updates via email"
          right={<Toggle enabled={prefs.emailNotifs} onChange={() => toggle('emailNotifs')} />}
        />
        <Row
          label="SMS / WhatsApp"
          sub="Reminder channels"
          right={<Toggle enabled={prefs.smsNotifs} onChange={() => toggle('smsNotifs')} />}
        />
        <Row
          label="Auto mark overdue"
          sub="Past-due invoices"
          right={<Toggle enabled={prefs.autoOverdue} onChange={() => toggle('autoOverdue')} />}
        />
        <Row
          label="Weekly summary"
          sub="Outstanding invoice digest"
          right={<Toggle enabled={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} />}
        />
      </Section>

      <Section title="Reminder engine">
        <Row
          label="Quiet hours"
          sub="No reminders 22:00–07:00"
          right={<span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">On</span>}
        />
        <Row
          label="Spam protection"
          sub="48h minimum between pings"
          right={<span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">On</span>}
        />
        <Row
          label="Escalation threshold"
          sub="Days overdue before firmer tone"
          right={<span className="font-mono text-xs text-slate-600 dark:text-slate-400">7</span>}
        />
        <Row
          label="AI model"
          sub="Message generation"
          right={<span className="font-mono text-xs text-slate-500">Gemini</span>}
        />
      </Section>

      <BizCard
        className="mb-6 border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white dark:border-blue-900 dark:from-blue-950/30 dark:to-biz-slate"
        title="Demo credentials"
        subtitle="Use for hackathon judging"
        hover={false}
      >
        <div className="space-y-0.5 font-mono text-sm text-blue-900 dark:text-blue-200">
          <p>demo@kirana.com</p>
          <p>demo1234</p>
        </div>
      </BizCard>

      <button
        type="button"
        onClick={handleSave}
        className={`w-full rounded-xl py-3 text-sm font-bold shadow-md transition active:scale-[0.99] ${
          saved
            ? 'bg-emerald-600 text-white dark:bg-emerald-600'
            : 'bg-gradient-to-r from-biz-accent to-blue-600 text-white dark:from-cyan-600 dark:to-blue-600'
        }`}
      >
        {saved ? 'Saved' : 'Save settings'}
      </button>
    </main>
  );
}
