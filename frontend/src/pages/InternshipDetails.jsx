import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBookmark, FiClock, FiHome, FiMapPin } from 'react-icons/fi';
import { appApi, errDetails, errMsg, internshipApi, savedApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { Async, Badge, Button, Card, Field, LinkBack } from '../components/ui';
import { EligibilityBadge, ExplanationList, LearningPath, ScoreBreakdown, ScoreRing, SeverityBadge, SkillChips, statusesFromMatch } from '../components/match';
import { deadlineInfo, fmtDate, stipendText } from '../utils/format';
import { STATUS_TONE } from '../constants';

export default function InternshipDetails() {
  const { id } = useParams(); const { user } = useAuth(); const { hash } = useLocation();
  const state = useFetch(() => internshipApi.one(id).then((r) => r.data), [id]);
  useEffect(() => { if (hash === '#apply' && !state.loading) document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' }); }, [hash, state.loading]);
  return <div className={user ? '' : 'mx-auto max-w-6xl px-4 py-10'}><Async state={state}>{(i) => <Body i={i} reload={() => state.reload(true)} user={user} />}</Async></div>;
}

function Body({ i, reload, user }) {
  const isStudent = user?.role === 'student';
  const c = i.compatibility;
  const dl = deadlineInfo(i.applicationDeadline);
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [applyErr, setApplyErr] = useState(null);
  const statuses = c ? statusesFromMatch(c, i.requiredSkills) : null;

  const apply = async () => {
    setBusy(true); setApplyErr(null);
    try { await appApi.apply({ internshipId: i._id, coverNote: note }); toast.success('Application submitted!'); reload(); }
    catch (e) { setApplyErr({ message: errMsg(e), reasons: errDetails(e)?.reasons }); } finally { setBusy(false); }
  };
  const toggleSave = async () => {
    try { if (i.saved) await savedApi.unsave(i._id); else await savedApi.save(i._id); toast.success(i.saved ? 'Removed from saved' : 'Saved'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <LinkBack to="/internships" label="All internships" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h1 className="text-2xl font-semibold md:text-3xl">{i.title}</h1><p className="mt-1 text-ink-soft">{i.companyId?.companyName}{i.companyId?.verified && <span className="ml-1 text-brand-600" title="Verified">✔</span>} · {i.companyId?.industry}</p></div>
              <Badge tone={dl.tone}>{dl.dot} {dl.label}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5"><FiMapPin />{i.location}</span><span className="flex items-center gap-1.5"><FiHome />{i.workMode}</span>
              <span className="flex items-center gap-1.5"><FiClock />{i.duration} months</span><span className="font-semibold text-ink">{stipendText(i.stipend)}</span><span>{i.openings} opening{i.openings > 1 ? 's' : ''}</span>
            </div>
            <p className="mt-5 whitespace-pre-line">{i.description}</p>
            {i.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{i.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</div>}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Skills</h2>
            <p className="label">Required</p>
            <SkillChips max={99} statuses={statuses || i.requiredSkills.map((s) => ({ name: s.name }))} />
            <ul className="mt-3 grid gap-1 text-sm text-ink-soft sm:grid-cols-2">{i.requiredSkills.map((s) => <li key={s.name}>{s.name} <span className="text-ink-faint">· {s.importance} importance</span></li>)}</ul>
            {i.preferredSkills?.length > 0 && <><p className="label mt-4">Preferred</p><div className="flex flex-wrap gap-1.5">{i.preferredSkills.map((s) => <Badge key={s}>{s}</Badge>)}</div></>}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Responsibilities</h2><ul className="list-disc space-y-1.5 pl-5 text-sm">{i.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></Card>
            <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Eligibility & benefits</h2>
              <ul className="space-y-1.5 text-sm"><li>Minimum CGPA: <b>{i.eligibility?.minCGPA || 'None'}</b></li><li>Branches: <b>{i.eligibility?.branches?.length ? i.eligibility.branches.join(', ') : 'All'}</b></li>
                <li>Graduation years: <b>{i.eligibility?.graduationYears?.length ? i.eligibility.graduationYears.join(', ') : 'Any'}</b></li><li>Degree: <b>{i.eligibility?.requiredDegree || 'Any'}</b></li></ul>
              {i.benefits?.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">{i.benefits.map((b) => <li key={b}>{b}</li>)}</ul>}
              {i.customFields && Object.keys(i.customFields).length > 0 && <div className="mt-3 rounded-lg bg-black/5 p-3 text-xs"><p className="mb-1 font-semibold">Additional details</p>{Object.entries(i.customFields).map(([k, v]) => <p key={k}><span className="text-ink-soft">{k}:</span> {Array.isArray(v) ? v.join(', ') : String(v)}</p>)}</div>}
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          {isStudent && c && (
            <Card className="p-6" id="compat">
              <h2 className="mb-4 text-lg font-semibold">Your Compatibility</h2>
              <div className="flex items-center gap-4"><ScoreRing value={c.overallScore} size={96} label="match" /><div className="space-y-1"><EligibilityBadge status={c.eligibility.status} /><p className="text-xs text-ink-soft">Confidence: <b>{c.confidence}</b></p><p className="text-xs text-ink-soft">{c.matchedSkills.length}/{i.requiredSkills.length} required skills</p></div></div>
              <div className="mt-5"><ScoreBreakdown scores={c.scores} /></div>
              <h3 className="mb-2 mt-6 font-sans text-sm font-semibold">Why this score?</h3><ExplanationList items={c.explanation} />
              {c.eligibility.checks?.length > 0 && <><h3 className="mb-2 mt-6 font-sans text-sm font-semibold">Eligibility checks</h3><ul className="space-y-1 text-xs">{c.eligibility.checks.map((k) => <li key={k.name} className={k.status === 'pass' ? 'text-brand-700' : k.status === 'fail' ? 'text-rose-600' : 'text-amber-600'}>{k.status === 'pass' ? '✓' : k.status === 'fail' ? '✕' : '?'} {k.reason}</li>)}</ul></>}
            </Card>
          )}
          {isStudent && !c && <Card className="p-6 text-sm"><h2 className="mb-1 text-lg font-semibold">Your Compatibility</h2><p className="text-ink-soft">Complete your profile to see how well you match.</p><Link to="/student/profile/edit" className="btn btn-primary btn-sm mt-3">Complete profile</Link></Card>}
          {!user && <Card className="p-6 text-sm"><h2 className="mb-1 text-lg font-semibold">Your Compatibility</h2><p className="text-ink-soft">Log in as a student to see your match score, explanation and skill gaps.</p><Link to="/login" className="btn btn-primary btn-sm mt-3">Log in</Link></Card>}

          {isStudent && (
            <Card className="p-6" id="apply">
              <h2 className="mb-3 text-lg font-semibold">Apply</h2>
              {i.application ? <div className="text-sm"><p>You applied on {fmtDate(i.application.appliedAt)}.</p><Badge className="mt-2" tone={STATUS_TONE[i.application.status]}>{i.application.status}</Badge><Link to="/student/applications" className="mt-3 block font-semibold text-brand-700">Open application tracker →</Link></div>
                : i.expired || i.status !== 'active' ? <p className="text-sm text-rose-600">Applications are closed for this internship.</p>
                : c?.eligibility.status === 'NOT_ELIGIBLE' ? <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600"><p className="font-semibold">You are not currently eligible for this internship.</p><p className="mt-1 text-xs">Reason:</p><ul className="list-disc pl-5 text-xs">{c.eligibility.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
                : <div className="space-y-3"><Field label="Cover note (optional)"><textarea className="input" rows={3} maxLength={1500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you a good fit?" /></Field>
                  {applyErr && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600"><p className="font-semibold">{applyErr.message}</p>{applyErr.reasons?.map((r) => <p key={r} className="mt-1 text-xs">Reason: {r}</p>)}</div>}
                  <Button className="w-full" loading={busy} onClick={apply}>Apply now</Button></div>}
              <Button variant="outline" className="mt-3 w-full" onClick={toggleSave}><FiBookmark className={i.saved ? 'fill-current' : ''} />{i.saved ? 'Saved' : 'Save for later'}</Button>
            </Card>
          )}

          {isStudent && c?.gap?.items?.length > 0 && (
            <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Skill gap</h2>
              <div className="space-y-4">{c.gap.items.map((g) => (
                <div key={g.skill}><div className="mb-1 flex items-center gap-2 text-sm font-semibold">{g.skill}<SeverityBadge severity={g.severity} />{g.type === 'partial' && <span className="text-xs font-normal text-ink-faint">related to your {g.via}</span>}</div><LearningPath learning={g.learning} /></div>))}</div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
