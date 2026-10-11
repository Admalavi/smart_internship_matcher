import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUsers } from 'react-icons/fi';
import { appApi, companyApi, errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Card, EmptyState, PageHeader, Select } from '../../components/ui';
import { MatchPill } from '../../components/match';
import { ALL_STATUSES, STATUS_TONE } from '../../constants';
import { fmtDate } from '../../utils/format';

const SETTABLE = ['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
export default function CompanyApplications() {
  const [sp, setSp] = useSearchParams();
  const internshipId = sp.get('internshipId') || ''; const [status, setStatus] = useState('');
  const list = useFetch(() => companyApi.internships().then((r) => r.data), []);
  const state = useFetch(() => companyApi.applications({ internshipId: internshipId || undefined, status: status || undefined }).then((r) => r.data), [internshipId, status]);
  const change = async (a, s) => {
    if (!s || s === a.status) return;
    const note = window.prompt(`Optional note to the candidate for "${s}":`, '') ?? '';
    try { await appApi.setStatus(a._id, s, note); toast.success(`Marked ${s}`); state.reload(true); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div><PageHeader title="Applications" subtitle="Sorted by candidate match score" />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:w-2/3"><Select placeholder="All internships" value={internshipId} onChange={(v) => (v ? setSp({ internshipId: v }) : setSp({}))} options={(list.data || []).map((i) => ({ value: i._id, label: i.title }))} />
        <Select placeholder="All statuses" value={status} onChange={setStatus} options={ALL_STATUSES} /></div>
      <Async state={state}>{(apps) => !apps.length ? <EmptyState icon={FiUsers} title="No applications found" text="Candidates who apply to your approved internships will appear here." /> : (
        <Card className="overflow-x-auto"><table className="w-full min-w-[48rem]"><thead className="border-b border-line bg-black/[.02]"><tr><th className="th">Candidate</th><th className="th">Internship</th><th className="th">Match</th><th className="th">Applied</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">{apps.map((a) => <tr key={a._id}><td className="td"><div className="font-semibold">{a.studentId?.name || a.snapshot?.studentName}</div><div className="text-xs text-ink-soft">{a.snapshot?.college} · CGPA {a.snapshot?.cgpa ?? '-'}</div></td>
            <td className="td">{a.internshipId?.title || a.snapshot?.internshipTitle}</td><td className="td"><MatchPill score={a.matchScore} /></td><td className="td text-ink-soft">{fmtDate(a.appliedAt)}</td>
            <td className="td">{a.status === 'Withdrawn' ? <Badge tone={STATUS_TONE.Withdrawn}>Withdrawn</Badge> : <select aria-label="Change status" className="input !w-36 !py-1" value={a.status} onChange={(e) => change(a, e.target.value)}><option>{a.status === 'Applied' ? 'Applied' : a.status}</option>{SETTABLE.filter((s) => s !== a.status).map((s) => <option key={s}>{s}</option>)}</select>}</td>
            <td className="td text-right"><Link to={`/company/applications/${a._id}`} className="btn btn-outline btn-sm">View</Link></td></tr>)}</tbody></table></Card>)}</Async>
    </div>
  );
}
