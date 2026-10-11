import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiTarget } from 'react-icons/fi';
import { appApi, errMsg, recApi, savedApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Button, Card, CardSkeleton, EmptyState, Modal, PageHeader } from '../../components/ui';
import InternshipCard from '../../components/InternshipCard';
import { EligibilityBadge, ExplanationList, ScoreBreakdown, ScoreRing, statusesFromMatch } from '../../components/match';
import { fmtDateTime } from '../../utils/format';

export default function Recommendations() {
  const [min, setMin] = useState(0); const [why, setWhy] = useState(null); const [busy, setBusy] = useState(false);
  const state = useFetch(() => recApi.list({ minScore: min }), [min]);
  const extras = useFetch(async () => ({ saved: new Set((await savedApi.list()).data.map((s) => s.internship._id)), applied: new Set((await appApi.list()).data.map((a) => a.internshipId?._id)) }), []);
  const history = useFetch(() => recApi.history().then((r) => r.data), []);
  const [savedLocal, setSavedLocal] = useState({});

  const refresh = async () => { setBusy(true); try { const r = await recApi.generate(); toast.success(r.message); await state.reload(true); history.reload(true); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } };
  const toggle = async (i) => {
    const now = savedLocal[i._id] ?? i.saved;
    try { if (now) await savedApi.unsave(i._id); else await savedApi.save(i._id); setSavedLocal({ ...savedLocal, [i._id]: !now }); toast.success(now ? 'Removed from saved' : 'Saved'); } catch (e) { toast.error(errMsg(e)); }
  };
  const items = useMemo(() => (state.data?.data || []).map((r) => ({ ...r.internship, _rec: r, matchScore: r.overallScore, eligibilityStatus: r.eligibility.status, skillStatuses: statusesFromMatch(r, r.internship.requiredSkills),
    saved: savedLocal[r.internship._id] ?? extras.data?.saved.has(r.internship._id), applied: extras.data?.applied.has(r.internship._id) })), [state.data, extras.data, savedLocal]);

  return (
    <div>
      <PageHeader title="Your recommendations" subtitle={state.data?.meta?.generatedAt ? `Generated ${fmtDateTime(state.data.meta.generatedAt)} · engine: ${state.data.meta.engine}` : 'Ranked by compatibility with your profile'}
        actions={<Button variant="outline" loading={busy} onClick={refresh}><FiRefreshCw />Refresh</Button>} />
      <div className="mb-5 flex items-center gap-3 text-sm"><label htmlFor="min" className="text-ink-soft">Minimum match</label><input id="min" type="range" min="0" max="90" step="10" value={min} onChange={(e) => setMin(Number(e.target.value))} className="accent-brand-600" /><b>{min}%</b></div>
      <Async state={state} skeleton={<CardSkeleton n={6} />}>{(r) => r.meta?.reason === 'INSUFFICIENT_PROFILE' || !items.length ? (
        <EmptyState icon={FiTarget} title="No recommendations yet" text={r.meta?.message || 'Complete your profile and add at least 3 technical skills to receive personalized internship recommendations.'} action={<Link to="/student/skills" className="btn btn-primary">Complete Profile</Link>} />
      ) : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((i) => <InternshipCard key={i._id} internship={i} canSave onSave={toggle} showWhy onWhy={setWhy} />)}</div>}</Async>

      <Modal open={!!why} onClose={() => setWhy(null)} title={why ? `${why.matchScore}% match - ${why.title}` : ''} wide>
        {why && <div className="grid gap-6 md:grid-cols-2"><div><div className="mb-4 flex items-center gap-3"><ScoreRing value={why._rec.overallScore} size={80} /><EligibilityBadge status={why._rec.eligibility.status} /></div><ScoreBreakdown scores={why._rec.scores} /></div>
          <div><h4 className="mb-2 font-sans text-sm font-semibold">Why?</h4><ExplanationList items={why._rec.explanation} /><Link to={`/internships/${why._id}`} className="btn btn-primary btn-sm mt-5">Open details</Link></div></div>}
      </Modal>

      <h2 className="mb-3 mt-12 text-lg font-semibold">Recommendation history</h2>
      <Async state={history} skeleton={<Card className="h-20 skeleton" />}>{(h) => !h.length ? <p className="text-sm text-ink-soft">No history yet.</p> : (
        <Card className="divide-y divide-line">{h.slice(0, 8).map((x) => <div key={x._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>{fmtDateTime(x.createdAt)}</span><span className="text-ink-soft">{x.meta?.count} internships scored · top {x.meta?.top}% · average {x.meta?.average}%</span></div>)}</Card>)}</Async>
    </div>
  );
}
