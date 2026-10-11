import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookmark, FiClock, FiHome, FiMapPin } from 'react-icons/fi';
import { Badge, Button, Card, cx } from './ui';
import { EligibilityBadge, MatchPill, SkillChips } from './match';
import { deadlineInfo, stipendText } from '../utils/format';

export default function InternshipCard({ internship: i, onSave, canSave, showWhy, onWhy }) {
  const company = i.companyId?.companyName || i.company?.companyName || '';
  const dl = deadlineInfo(i.applicationDeadline);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="flex h-full flex-col p-5 transition hover:border-ink-faint">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-sans text-base font-semibold leading-snug"><Link to={`/internships/${i._id}`} className="hover:text-brand-700">{i.title}</Link></h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">{company}{i.companyId?.verified && <span title="Verified company" className="text-brand-600">✔</span>}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1"><MatchPill score={i.matchScore} />{i.eligibilityStatus && i.eligibilityStatus !== 'ELIGIBLE' && <EligibilityBadge status={i.eligibilityStatus} />}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1"><FiMapPin />{i.location}</span><span className="font-semibold text-ink">{stipendText(i.stipend)}</span>
          <span className="flex items-center gap-1"><FiClock />{i.duration} months</span><span className="flex items-center gap-1"><FiHome />{i.workMode}</span>
        </div>
        <div className="mt-3 flex-1">
          <SkillChips statuses={i.skillStatuses || i.requiredSkills.map((s) => ({ name: s.name }))} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Badge tone={dl.tone}>{dl.dot} {dl.label}</Badge><Badge>{i.domain}</Badge>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
          <Link to={`/internships/${i._id}`} className="btn btn-outline btn-sm flex-1">View Details</Link>
          {showWhy && <Button variant="ghost" size="sm" onClick={() => onWhy(i)}>Why?</Button>}
          {canSave && <Button variant="ghost" size="sm" onClick={() => onSave(i)} aria-label={i.saved ? 'Unsave' : 'Save'} className={cx(i.saved && 'text-brand-700')}><FiBookmark className={i.saved ? 'fill-current' : ''} />{i.saved ? 'Saved' : 'Save'}</Button>}
          {i.applied ? <Badge tone="bg-brand-100 text-brand-700">Applied</Badge> : <Link to={`/internships/${i._id}#apply`} className="btn btn-primary btn-sm">Apply</Link>}
        </div>
      </Card>
    </motion.div>
  );
}
