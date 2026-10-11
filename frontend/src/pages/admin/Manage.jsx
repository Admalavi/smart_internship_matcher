import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { adminApi, errMsg, internshipApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, EmptyState, PageHeader, Pagination, Select } from '../../components/ui';
import { ALL_STATUSES, STATUS_TONE } from '../../constants';
import { fmtDate } from '../../utils/format';
import { MatchPill } from '../../components/match';

const Table = ({ head, children, min = '44rem' }) => <Card className="overflow-x-auto"><table className="w-full" style={{ minWidth: min }}><thead className="border-b border-line bg-black/[.02]"><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{children}</tbody></table></Card>;
const Search = ({ value, onChange, placeholder }) => <div className="relative mb-4 max-w-sm"><FiSearch className="absolute left-3 top-3 text-ink-faint" /><input className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
const useAct = (reload) => async (fn, ok) => { try { await fn(); toast.success(ok); reload(true); } catch (e) { toast.error(errMsg(e)); } };

export function ManageStudents() {
  const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const state = useFetch(() => adminApi.users({ role: 'student', q: q || undefined, page, limit: 15 }), [q, page]);
  const act = useAct(state.reload);
  return (
    <div><PageHeader title="Manage students" /><Search value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name or email" />
      <Async state={state}>{(r) => !r.data.length ? <EmptyState title="No students found" /> : (<>
        <Table head={['Student', 'College', 'CGPA', 'Skills', 'Profile', 'Status', '']}>{r.data.map((u) => <tr key={u._id}><td className="td"><div className="font-semibold">{u.name}</div><div className="text-xs text-ink-soft">{u.email}</div></td><td className="td">{u.profile?.college || '-'}</td><td className="td">{u.profile?.cgpa ?? '-'}</td><td className="td">{u.profile?.skills ?? 0}</td><td className="td">{u.profile?.completion ?? 0}%</td>
          <td className="td"><Badge tone={u.isActive ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge></td>
          <td className="td"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => act(() => adminApi.setUserStatus(u._id, !u.isActive), u.isActive ? 'Account deactivated' : 'Account activated')}>{u.isActive ? 'Deactivate' : 'Activate'}</Button><Button variant="ghost" size="sm" onClick={() => window.confirm(`Delete ${u.name} and all their data?`) && act(() => adminApi.deleteUser(u._id), 'Student removed')}>Delete</Button></div></td></tr>)}</Table>
        <Pagination meta={r.meta} onPage={setPage} /></>)}</Async>
    </div>
  );
}

export function ManageCompanies() {
  const [q, setQ] = useState('');
  const state = useFetch(() => adminApi.companies({ q: q || undefined }).then((r) => r.data), [q]);
  const act = useAct(state.reload);
  return (
    <div><PageHeader title="Manage companies" /><Search value={q} onChange={setQ} placeholder="Search companies" />
      <Async state={state}>{(list) => !list.length ? <EmptyState title="No companies found" /> : <Table head={['Company', 'Industry', 'Location', 'Internships', 'Verified', '']}>{list.map((c) => <tr key={c._id}><td className="td"><div className="font-semibold">{c.companyName}</div><div className="text-xs text-ink-soft">{c.userId?.email}</div></td><td className="td">{c.industry}</td><td className="td">{c.location}</td><td className="td">{c.activeInternships}/{c.internships}</td>
        <td className="td"><Badge tone={c.verified ? 'bg-brand-100 text-brand-700' : 'bg-amber-50 text-amber-600'}>{c.verified ? 'Verified' : 'Pending'}</Badge></td>
        <td className="td"><div className="flex justify-end gap-1"><Button variant="outline" size="sm" onClick={() => act(() => adminApi.verify(c._id, !c.verified), c.verified ? 'Verification removed' : 'Company verified')}>{c.verified ? 'Unverify' : 'Verify'}</Button>
          {c.userId && <Button variant="ghost" size="sm" onClick={() => window.confirm(`Remove ${c.companyName}? Its internships will be closed.`) && act(() => adminApi.deleteUser(c.userId._id), 'Company removed')}>Remove</Button>}</div></td></tr>)}</Table>}</Async>
    </div>
  );
}

const AP = { approved: 'bg-brand-100 text-brand-700', pending: 'bg-amber-50 text-amber-600', rejected: 'bg-rose-50 text-rose-600' };
export function ManageInternships() {
  const [approval, setApproval] = useState('pending'); const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const state = useFetch(() => adminApi.internships({ approvalStatus: approval || undefined, q: q || undefined, page, limit: 15 }), [approval, q, page]);
  const act = useAct(state.reload);
  const decide = (i, status) => { const note = status === 'rejected' ? window.prompt('Reason for rejection (shown to the company):', '') ?? '' : ''; return act(() => adminApi.approval(i._id, status, note), `Internship ${status}`); };
  return (
    <div><PageHeader title="Manage internships" subtitle="Approve or reject postings; remove inappropriate opportunities." />
      <div className="mb-4 flex flex-wrap gap-3"><div className="w-44"><Select value={approval} onChange={(v) => { setApproval(v); setPage(1); }} placeholder="All" options={['pending', 'approved', 'rejected']} /></div><div className="flex-1"><Search value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search title or domain" /></div></div>
      <Async state={state}>{(r) => !r.data.length ? <EmptyState title="Nothing here" text="No internships match this filter." /> : (<>
        <Table min="52rem" head={['Internship', 'Company', 'Deadline', 'Approval', '']}>{r.data.map((i) => <tr key={i._id}><td className="td"><Link to={`/internships/${i._id}`} className="font-semibold hover:text-brand-700">{i.title}</Link><div className="text-xs text-ink-soft">{i.domain} · {i.location} · {i.status}</div></td><td className="td">{i.companyId?.companyName}</td><td className="td">{fmtDate(i.applicationDeadline)}</td><td className="td"><Badge tone={AP[i.approvalStatus]}>{i.approvalStatus}</Badge></td>
          <td className="td"><div className="flex justify-end gap-1">{i.approvalStatus !== 'approved' && <Button size="sm" onClick={() => decide(i, 'approved')}>Approve</Button>}{i.approvalStatus !== 'rejected' && <Button variant="outline" size="sm" onClick={() => decide(i, 'rejected')}>Reject</Button>}
            <Button variant="ghost" size="sm" onClick={() => window.confirm(`Delete "${i.title}" permanently?`) && act(() => internshipApi.remove(i._id), 'Internship removed')}>Delete</Button></div></td></tr>)}</Table>
        <Pagination meta={r.meta} onPage={setPage} /></>)}</Async>
    </div>
  );
}

export function ManageApplications() {
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const state = useFetch(() => adminApi.applications({ status: status || undefined, page, limit: 20 }), [status, page]);
  return (
    <div><PageHeader title="Applications" /><div className="mb-4 w-52"><Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} placeholder="All statuses" options={ALL_STATUSES} /></div>
      <Async state={state}>{(r) => !r.data.length ? <EmptyState title="No applications" /> : (<>
        <Table head={['Student', 'Internship', 'Match', 'Applied', 'Status']}>{r.data.map((a) => <tr key={a._id}><td className="td"><div className="font-semibold">{a.studentId?.name || a.snapshot?.studentName}</div><div className="text-xs text-ink-soft">{a.studentId?.email}</div></td><td className="td">{a.internshipId?.title || a.snapshot?.internshipTitle}<div className="text-xs text-ink-soft">{a.snapshot?.companyName}</div></td><td className="td"><MatchPill score={a.matchScore} /></td><td className="td">{fmtDate(a.appliedAt)}</td><td className="td"><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></td></tr>)}</Table>
        <Pagination meta={r.meta} onPage={setPage} /></>)}</Async>
    </div>
  );
}
