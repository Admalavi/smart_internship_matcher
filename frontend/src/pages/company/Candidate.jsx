import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { appApi, companyApi, errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, LinkBack, PageHeader } from '../../components/ui';
import { EligibilityBadge, ExplanationList, ScoreBreakdown, ScoreRing } from '../../components/match';
import { STATUS_TONE } from '../../constants';
import { fmtDate, fmtDateTime } from '../../utils/format';

export default function Candidate() {
  const { id } = useParams();
  const state = useFetch(() => companyApi.candidate(id).then((r) => r.data), [id]);
  const set = async (s) => { const note = window.prompt(`Note for "${s}" (optional):`, '') ?? ''; try { await appApi.setStatus(id, s, note); toast.success(`Marked ${s}`); state.reload(true); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div><LinkBack to="/company/applications" label="All applications" />
      <Async state={state}>{({ application: a, profile: p, internship: i, compatibility: c }) => (
        <div><PageHeader title={a.studentId?.name} subtitle={`${a.studentId?.email} · applied to ${i?.title || a.snapshot?.internshipTitle} on ${fmtDate(a.appliedAt)}`} actions={<Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>} />
          {a.status !== 'Withdrawn' && <div className="mb-6 flex flex-wrap gap-2">{['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].filter((s) => s !== a.status).map((s) => <Button key={s} size="sm" variant={s === 'Rejected' ? 'danger' : s === 'Selected' ? 'primary' : 'outline'} onClick={() => set(s)}>{s}</Button>)}</div>}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Education</h2>{p ? <p className="text-sm">{p.education?.degree}, {p.education?.branch} - {p.education?.college} ({p.education?.graduationYear}) · CGPA <b>{p.education?.cgpa ?? '-'}</b></p> : <p className="text-sm text-ink-soft">Profile unavailable.</p>}</Card>
              <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Skills</h2><div className="flex flex-wrap gap-1.5">{p?.skills.map((s) => <Badge key={s._id} tone="bg-black/5 text-ink">{s.name} · {s.proficiency}</Badge>)}</div></Card>
              <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Projects</h2><div className="space-y-3">{p?.projects.map((x) => <div key={x._id}><b className="text-sm">{x.title}</b><p className="text-xs text-ink-soft">{x.description}</p><div className="mt-1 flex flex-wrap gap-1">{x.technologies.map((t) => <Badge key={t}>{t}</Badge>)}</div></div>)}{!p?.projects.length && <p className="text-sm text-ink-soft">No projects.</p>}</div></Card>
              {a.coverNote && <Card className="p-6"><h2 className="mb-2 text-lg font-semibold">Cover note</h2><p className="text-sm">{a.coverNote}</p></Card>}
              <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">History</h2><ol className="space-y-2 text-sm">{a.statusHistory.map((h, k) => <li key={k}><b>{h.status}</b> <span className="text-ink-faint">· {fmtDateTime(h.changedAt)}</span>{h.note && <span className="text-ink-soft"> - {h.note}</span>}</li>)}</ol></Card>
            </div>
            {c && <Card className="h-fit p-6"><h2 className="mb-4 text-lg font-semibold">Candidate compatibility</h2><div className="flex items-center gap-4"><ScoreRing value={c.overallScore} size={90} label="match" /><EligibilityBadge status={c.eligibility.status} /></div><div className="mt-5"><ScoreBreakdown scores={c.scores} /></div><h3 className="mb-2 mt-6 font-sans text-sm font-semibold">Why this score?</h3><ExplanationList items={c.explanation} /></Card>}
          </div></div>)}</Async>
    </div>
  );
}
