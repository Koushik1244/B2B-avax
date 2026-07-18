import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiCheck, HiOutlineDocumentText, HiOutlineSparkles, HiOutlineChartBarSquare } from 'react-icons/hi2';

const LandingHero3D = lazy(() => import('../components/landing/LandingHero3D'));

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

/** Live Three.js hero + product capability strip */
function LandingHeroPanel() {
  const highlights = [
    { Icon: HiOutlineDocumentText, title: 'GST-ready invoices', sub: 'PDF export & UPI QR in one place' },
    { Icon: HiOutlineSparkles, title: 'Gemini reminders', sub: 'Tone-aware follow-ups for your customers' },
    { Icon: HiOutlineChartBarSquare, title: 'Analytics & health', sub: 'See revenue and risk at a glance' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,560px)]">
      <Suspense
        fallback={
          <div className="flex h-[min(340px,48vh)] min-h-[240px] items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            <span className="text-sm font-medium text-cyan-400/80">Loading 3D preview…</span>
          </div>
        }
      >
        <LandingHero3D />
      </Suspense>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {highlights.map(({ Icon, title, sub }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm transition hover:border-cyan-500/35 hover:bg-white/[0.07]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemSection() {
  const bullets = [
    'Frequent alerts and pings fragment your focus when you need deep work.',
    'Switching between apps and tabs burns time and breaks your mental flow.',
    'Disconnected tools don’t share context — you re‑explain the same work everywhere.',
    'Notification overload makes it hard to see what actually matters today.',
  ];

  return (
    <section className="relative border-y border-white/5 bg-[#08080c] py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(239,68,68,0.06),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-rose-400/90">The problem</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.2rem] md:leading-tight">
              Fragmented apps. Random noise.
            </h2>
            <p className="mt-4 text-base text-gray-400">
              Your attention gets auctioned off to whoever pings loudest — not to what moves your work forward.
            </p>
            <ul className="mt-8 space-y-4">
              {bullets.map((text) => (
                <li key={text} className="flex gap-3 text-sm text-gray-300 md:text-[15px]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Chaotic notification stack */}
          <div className="relative mx-auto min-h-[280px] w-full max-w-md lg:mx-0">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-950/30 to-transparent blur-3xl" />
            <div className="relative space-y-3 p-4">
              {[
                { t: 'Slack — @channel', d: 'New thread in #design' },
                { t: 'Email (3)', d: 'Re: Invoice #1042' },
                { t: 'Calendar', d: 'Meeting in 2 min' },
                { t: 'Jira', d: 'Sprint comment on APP-441' },
              ].map((n, i) => (
                <div
                  key={n.t}
                  className={`flex items-center gap-3 rounded-xl border border-rose-500/20 bg-[#12121a]/90 px-4 py-3 shadow-lg backdrop-blur ${
                    i === 0 ? 'animate-pop-alert' : i === 1 ? 'animate-pop-alert-2' : i === 2 ? 'animate-pop-alert-3' : 'animate-pop-alert'
                  }`}
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300">
                    <BellIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{n.t}</p>
                    <p className="truncate text-[11px] text-gray-500">{n.d}</p>
                  </div>
                  <span className="text-[10px] text-rose-400/80">now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(34,211,238,0.08),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0f172a]/90 to-[#0a0a12] p-6 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">Today</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">All synced</span>
              </div>
              <div className="space-y-3">
                {[
                  { t: 'Review invoice batch', s: 'done', anim: 'animate-flow-merge' },
                  { t: 'Customer follow-ups', s: '3 tasks', anim: 'animate-flow-merge' },
                  { t: 'Reminders scheduled', s: 'auto', anim: 'animate-flow-merge' },
                ].map((row, i) => (
                  <div
                    key={row.t}
                    className={`flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 ${row.anim}`}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <span className="text-sm text-gray-200">{row.t}</span>
                    <span className="text-[11px] text-cyan-400/90">{row.s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/90">The solution</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.2rem] md:leading-tight">
              Smarter Notifications. Unified Workflow.
            </h2>
            <p className="mt-4 text-base text-gray-400">
              One intelligent surface pulls signals together, prioritizes what matters, and keeps your workflow moving — without the tab shuffle.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <HiCheck className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                Context-aware routing so the right work surfaces first
              </li>
              <li className="flex items-center gap-2">
                <HiCheck className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                Tasks and alerts flow into a single actionable dashboard
              </li>
              <li className="flex items-center gap-2">
                <HiCheck className="h-4 w-4 shrink-0 text-fuchsia-400" aria-hidden />
                Subtle motion and focus-friendly layout — built for clarity
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="landing-mesh fixed inset-0 -z-10 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,5,8,0)_0%,#050508_90%)]" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050508]/80 px-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-bold shadow-lg shadow-cyan-500/20">
              SI
            </div>
            <span className="font-semibold tracking-tight text-white">Smart Invoicing</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-cyan-500/40 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="text-center lg:text-left">
              <p className="mb-4 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300/90">
                Attention · Workflow · One surface
              </p>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
                Master Your Attention.
                <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                  Streamline Your Workflows.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400 lg:mx-0">
                Stop juggling siloed tools and endless pings. Pull every signal into one calm, intelligent command center.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                <Link
                  to={ctaTo}
                  className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-violet-500 px-8 py-3.5 text-base font-semibold text-[#050508] shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:brightness-110"
                >
                  See it in Action
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-gray-500 transition hover:text-cyan-400"
                >
                  Create an account →
                </Link>
              </div>
            </div>
            <LandingHeroPanel />
          </div>
        </section>

        <ProblemSection />
        <SolutionSection />

        {/* Bottom CTA */}
        <section className="relative border-t border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h3 className="text-2xl font-bold text-white md:text-3xl">Ready to own your workflow?</h3>
            <p className="mt-3 text-gray-400">Open the live dashboard and explore how unified notifications feel.</p>
            <Link
              to={ctaTo}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-10 py-4 text-base font-semibold text-white shadow-[0_0_50px_rgba(139,92,246,0.35)] transition hover:brightness-110"
            >
              See it in Action
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-600">
          <p>Smart Invoicing Assistant — focus-friendly tools for real work.</p>
        </footer>
      </main>
    </div>
  );
}
