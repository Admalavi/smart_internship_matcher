import { FiAlertTriangle, FiCheck, FiInfo, FiX, FiLink } from 'react-icons/fi';
import { Badge, ProgressBar, cx } from './ui';
import { scoreBg, scoreTone } from '../utils/format';

export function ScoreRing({ value, size = 84, label }) {
  const r = (size - 10) / 2; const c = 2 * Math.PI * r; const off = c * (1 - Math.min(100, value || 0) / 100);
  const color = value >= 80 ? '#0E7C68' : value >= 60 ? '#E59A14' : '#D6453D';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% match`}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="#ECE8DF" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s ease' }} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-bold leading-none">{value ?? '-'}%</span>{label && <span className="mt-0.5 text-[10px] text-ink-soft">{label}</span>}</div>
    </div>
  );
}

export const MatchPill = ({ score }) => score == null ? null : (
  <span className={cx('badge', score >= 80 ? 'bg-brand-100 text-brand-700' : score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}>{score}% Match</span>
);

const EL = { ELIGIBLE: ['bg-brand-100 text-brand-700', 'Eligible'], PARTIALLY_ELIGIBLE: ['bg-amber-50 text-amber-600', 'Partially eligible'], NOT_ELIGIBLE: ['bg-rose-50 text-rose-600', 'Not eligible'] };
export const EligibilityBadge = ({ status }) => status ? <Badge tone={EL[status][0]}>{EL[status][1]}</Badge> : null;

const ICON = { positive: [FiCheck, 'text-brand-600'], warning: [FiAlertTriangle, 'text-amber-600'], negative: [FiX, 'text-rose-600'], info: [FiInfo, 'text-ink-soft'] };
export const ExplanationList = ({ items = [] }) => (
  <ul className="space-y-2">
    {items.map((e, i) => { const [Icon, tone] = ICON[e.type] || ICON.info; return <li key={i} className="flex items-start gap-2 text-sm"><Icon className={cx('mt-0.5 shrink-0', tone)} /><span>{e.text}</span></li>; })}
  </ul>
);

/** matched / partial / missing chips - from internship.skillStatuses or a match object */
export function SkillChips({ statuses = [], max = 6 }) {
  const shown = statuses.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span key={s.name} className={cx('badge', s.status === 'matched' ? 'bg-brand-50 text-brand-700' : s.status === 'partial' ? 'bg-amber-50 text-amber-600' : s.status === 'missing' ? 'bg-rose-50 text-rose-600' : 'bg-black/5 text-ink-soft')}>
          {s.name}{s.status === 'matched' && ' ✓'}{s.status === 'partial' && ' ◐'}{s.status === 'missing' && ' ⚠'}
        </span>
      ))}
      {statuses.length > max && <span className="badge bg-black/5 text-ink-soft">+{statuses.length - max}</span>}
    </div>
  );
}

export const statusesFromMatch = (m, required = []) => {
  const matched = new Set((m.matchedSkills || []).map((s) => s.name)); const partial = new Set((m.partialSkills || []).map((s) => s.name));
  return required.map((s) => ({ name: s.name, importance: s.importance, status: matched.has(s.name) ? 'matched' : partial.has(s.name) ? 'partial' : 'missing' }));
};

const LABELS = { skillMatch: 'Skills (40%)', eligibility: 'Eligibility (15%)', domainInterest: 'Domain interest (15%)', locationPreference: 'Location (10%)', durationPreference: 'Duration (10%)', projectRelevance: 'Project relevance (10%)' };
export const ScoreBreakdown = ({ scores = {} }) => (
  <div className="space-y-3">
    {Object.keys(LABELS).map((k) => (
      <div key={k}><div className="mb-1 flex justify-between text-xs"><span className="text-ink-soft">{LABELS[k]}</span><span className={cx('font-semibold', scoreTone(scores[k] ?? 0))}>{scores[k] ?? 0}%</span></div><ProgressBar value={scores[k] ?? 0} tone={scoreBg(scores[k] ?? 0)} /></div>
    ))}
  </div>
);

const SEV = { Critical: 'bg-rose-50 text-rose-600', Moderate: 'bg-amber-50 text-amber-600', Minor: 'bg-yellow-50 text-yellow-700' };
export const SeverityBadge = ({ severity }) => <Badge tone={SEV[severity] || ''}>{severity}</Badge>;

export const LearningPath = ({ learning }) => !learning?.steps?.length ? <p className="text-sm text-ink-faint">No learning path stored for this skill yet.</p> : (
  <div>
    <ol className="space-y-1.5 text-sm">{learning.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">{i + 1}</span>{s}</li>)}</ol>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {learning.estimatedHours && <Badge>~{learning.estimatedHours} hours</Badge>}
      {(learning.resources || []).map((r) => <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 underline underline-offset-2"><FiLink size={12} />{r.title}</a>)}
    </div>
  </div>
);
