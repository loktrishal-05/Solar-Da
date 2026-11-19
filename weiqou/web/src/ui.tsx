import React from 'react';

// Shared building blocks. One radius scale: 12px for surfaces, full for pills.
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-leaf-700 text-white hover:bg-leaf-800',
  secondary: 'bg-white text-ink border border-leaf-200 hover:border-leaf-600',
  ghost: 'text-leaf-800 hover:bg-leaf-100',
  danger: 'bg-veto text-white hover:brightness-95',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }> = ({ variant = 'primary', className = '', ...rest }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT[variant]} ${className}`}
    {...rest}
  />
);

export const Card: React.FC<React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' }> = ({ as: Tag = 'section', className = '', ...rest }) => (
  <Tag className={`rounded-xl border border-leaf-100 bg-white p-5 ${className}`} {...rest} />
);

export const PageHeader: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-leaf-950">{title}</h1>
      {subtitle && <p className="mt-1 text-[15px] text-ink/70">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </header>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'veto' | 'human' | 'allow' }> = ({ label, value, hint, tone = 'default' }) => {
  const color = { default: 'text-leaf-950', veto: 'text-veto', human: 'text-human', allow: 'text-allow' }[tone];
  return (
    <div>
      <div className="text-sm text-ink/60">{label}</div>
      <div className={`font-display text-3xl font-bold leading-tight ${color}`}>{value}</div>
      {hint && <div className="text-xs text-ink/55 mt-0.5">{hint}</div>}
    </div>
  );
};

// Where a number came from. Always visible, never colour alone.
export type Source = 'replay' | 'sim' | 'live' | 'sample';
const SOURCE: Record<Source, [string, string]> = {
  replay: ['Replayed data', 'bg-amber-50 text-amber-900 border-amber-300'],
  sim: ['Simulation', 'bg-sky-50 text-sky-900 border-sky-300'],
  live: ['Live', 'bg-leaf-50 text-leaf-800 border-leaf-200'],
  sample: ['Sample content', 'bg-stone-100 text-stone-700 border-stone-300'],
};
export const SourceBadge: React.FC<{ source: Source; className?: string }> = ({ source, className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${SOURCE[source][1]} ${className}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
    {SOURCE[source][0]}
  </span>
);

export type VerdictKind = 'allow' | 'modify' | 'veto' | 'needs_human';
const VERDICT: Record<VerdictKind, [string, string]> = {
  allow: ['Allowed', 'text-allow border-allow'],
  modify: ['Modified', 'text-modify border-modify'],
  veto: ['Blocked', 'text-veto border-veto'],
  needs_human: ['Needs a human', 'text-human border-human'],
};
export const VerdictStamp: React.FC<{ verdict: VerdictKind; className?: string }> = ({ verdict, className = '' }) => (
  <span className={`inline-block rotate-[-4deg] rounded-md border-[3px] px-3 py-1 font-display text-lg font-extrabold tracking-wide ${VERDICT[verdict][1]} ${className}`}>
    {VERDICT[verdict][0]}
  </span>
);
export const verdictOf = (v: { verdict: string; needs_human?: boolean }): VerdictKind =>
  v.verdict === 'veto' ? 'veto' : v.needs_human ? 'needs_human' : v.verdict === 'modify' ? 'modify' : 'allow';

export const EmptyState: React.FC<{ title: string; body: React.ReactNode; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="rounded-xl border border-dashed border-leaf-200 bg-leaf-50/50 px-5 py-8 text-center">
    <div className="font-display text-lg font-semibold text-leaf-900">{title}</div>
    <div className="mt-1 text-sm text-ink/65 max-w-md mx-auto">{body}</div>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-leaf-950'}`}>
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="15" fill={light ? '#A3C94B' : '#1F5A3F'} />
      <path d="M16 25V13m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0 4c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" stroke={light ? '#0C261C' : '#fff'} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
    Solarda
  </span>
);
