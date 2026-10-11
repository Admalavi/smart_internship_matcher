export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const stipendText = (s) => (!s || (!s.min && !s.max) ? 'Unpaid' : s.min === s.max || !s.min ? `${money(s.max)}/mo` : `${money(s.min)} - ${money(s.max)}/mo`);
export const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
export const deadlineInfo = (d) => {
  const n = daysLeft(d);
  if (n < 0) return { label: 'Closed', tone: 'bg-black/5 text-ink-soft', dot: '⚫' };
  if (n <= 0) return { label: 'Deadline today', tone: 'bg-rose-50 text-rose-600', dot: '🔴' };
  if (n <= 2) return { label: `Deadline in ${n} day${n === 1 ? '' : 's'}`, tone: 'bg-amber-50 text-amber-600', dot: '🟠' };
  if (n <= 7) return { label: `Deadline in ${n} days`, tone: 'bg-yellow-50 text-yellow-700', dot: '🟡' };
  return { label: `Closes ${fmtDate(d)}`, tone: 'bg-black/5 text-ink-soft', dot: '' };
};
export const scoreTone = (s) => (s >= 80 ? 'text-brand-600' : s >= 60 ? 'text-amber-600' : 'text-rose-600');
export const scoreBg = (s) => (s >= 80 ? 'bg-brand-500' : s >= 60 ? 'bg-amber-500' : 'bg-rose-500');
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const initials = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const fileUrl = (p, base) => (p ? (p.startsWith('http') ? p : `${base}${p}`) : null);
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
