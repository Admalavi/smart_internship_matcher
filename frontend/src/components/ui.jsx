import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { scoreBg } from '../utils/format';

export const cx = (...a) => a.filter(Boolean).join(' ');

export const Spinner = ({ className = 'h-5 w-5' }) => (
  <span className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)} />
);

export const Button = ({ variant = 'primary', size, loading, children, className, ...p }) => (
  <button {...p} disabled={p.disabled || loading} className={cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}>
    {loading && <Spinner className="h-3.5 w-3.5" />}{children}
  </button>
);

export const Card = ({ className, children, ...p }) => <div {...p} className={cx('card', className)}>{children}</div>;

export const Badge = ({ tone = 'bg-black/5 text-ink-soft', children, className }) => <span className={cx('badge', tone, className)}>{children}</span>;

export const Skeleton = ({ className = 'h-4 w-full' }) => <div className={cx('skeleton rounded-md', className)} />;
export const CardSkeleton = ({ n = 3 }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: n }).map((_, i) => (
      <Card key={i} className="space-y-3 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-9 w-full" /></Card>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6"><Skeleton className="h-9 w-64" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div><CardSkeleton n={3} /></div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <Card className="flex flex-col items-center px-6 py-14 text-center">
    {Icon && <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-600"><Icon size={26} /></div>}
    <h3 className="text-lg font-semibold">{title}</h3>
    {text && <p className="mt-1 max-w-md text-sm text-ink-soft">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </Card>
);

export const ErrorState = ({ message, onRetry }) => (
  <Card className="flex flex-col items-center px-6 py-12 text-center">
    <div className="mb-3 rounded-full bg-rose-50 p-3 text-rose-600"><FiAlertTriangle size={22} /></div>
    <h3 className="font-semibold">Something went wrong</h3>
    <p className="mt-1 max-w-md text-sm text-ink-soft">{message}</p>
    {onRetry && <Button variant="outline" className="mt-4" onClick={() => onRetry()}>Try again</Button>}
  </Card>
);

/** Renders skeleton / error / children(data) for a useFetch result. */
export const Async = ({ state, skeleton = <PageSkeleton />, children }) => {
  if (state.loading) return skeleton;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  return children(state.data);
};

export const ProgressBar = ({ value, className, tone }) => (
  <div className={cx('h-2 w-full overflow-hidden rounded-full bg-black/5', className)}>
    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} className={cx('h-full rounded-full', tone || scoreBg(value))} />
  </div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}</div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, hint, tone = 'bg-brand-50 text-brand-600' }) => (
  <Card className="flex items-center gap-4 p-5">
    {Icon && <div className={cx('rounded-xl p-3', tone)}><Icon size={20} /></div>}
    <div><div className="text-2xl font-semibold leading-none">{value}</div><div className="mt-1 text-xs text-ink-soft">{label}</div>{hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}</div>
  </Card>
);

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
        className={cx('max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="mb-4 flex items-start justify-between gap-4"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="rounded p-1 text-ink-soft hover:bg-black/5" aria-label="Close"><FiX /></button></div>
        {children}
      </motion.div>
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <label className="block"><span className="label">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}</label>
);

export const Select = ({ options, value, onChange, placeholder, ...p }) => (
  <select {...p} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
);

/** Toggle chips for multi-select (locations, work modes, domains ...) */
export const ChipSelect = ({ options, value = [], onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const on = value.includes(o);
      return <button type="button" key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
        className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-soft hover:border-ink-faint')}>{o}</button>;
    })}
  </div>
);

/** Free-text tag input (Enter or comma to add). */
export function TagInput({ value = [], onChange, placeholder }) {
  const add = (raw) => { const t = raw.trim(); if (t && !value.includes(t)) onChange([...value, t]); };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white p-2 focus-within:border-brand-500">
      {value.map((t) => <span key={t} className="badge bg-brand-50 text-brand-700">{t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))}><FiX size={12} /></button></span>)}
      <input className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none" placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(e.target.value); e.target.value = ''; } }}
        onBlur={(e) => { add(e.target.value); e.target.value = ''; }} />
    </div>
  );
}

export const Pagination = ({ meta, onPage }) => meta && meta.pages > 1 && (
  <div className="mt-6 flex items-center justify-center gap-3 text-sm">
    <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
    <span className="text-ink-soft">Page {meta.page} of {meta.pages}</span>
    <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</Button>
  </div>
);

export const ChartCard = ({ title, subtitle, children, className }) => (
  <Card className={cx('p-5', className)}><h3 className="text-base font-semibold">{title}</h3>{subtitle && <p className="mb-3 text-xs text-ink-soft">{subtitle}</p>}<div className="mt-2">{children}</div></Card>
);

export const NoData = ({ text = 'No data yet' }) => <div className="py-10 text-center text-sm text-ink-faint">{text}</div>;

import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
export const LinkBack = ({ to, label }) => <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"><FiArrowLeft />{label}</Link>;
