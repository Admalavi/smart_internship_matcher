import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBriefcase, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { companyApi, errMsg, internshipApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, EmptyState, PageHeader } from '../../components/ui';
import { deadlineInfo, fmtDate } from '../../utils/format';

const APPROVAL = { approved: 'bg-brand-100 text-brand-700', pending: 'bg-amber-50 text-amber-600', rejected: 'bg-rose-50 text-rose-600' };
export default function MyInternships() {
  const state = useFetch(() => companyApi.internships().then((r) => r.data), []);
  const toggle = async (i) => { try { await internshipApi.update(i._id, { status: i.status === 'active' ? 'closed' : 'active' }); toast.success(i.status === 'active' ? 'Internship closed' : 'Internship reopened'); state.reload(true); } catch (e) { toast.error(errMsg(e)); } };
  const remove = async (i) => { if (!window.confirm(`Delete "${i.title}"? Existing applications are kept for your records.`)) return; try { await internshipApi.remove(i._id); toast.success('Deleted'); state.reload(true); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div><PageHeader title="My internships" actions={<Link to="/company/internships/new" className="btn btn-primary">Post internship</Link>} />
      <Async state={state}>{(list) => !list.length ? <EmptyState icon={FiBriefcase} title="No internships posted" text="Create your first internship to start receiving matched candidates." action={<Link to="/company/internships/new" className="btn btn-primary">Post internship</Link>} /> : (
        <Card className="overflow-x-auto"><table className="w-full min-w-[44rem]"><thead className="border-b border-line bg-black/[.02]"><tr><th className="th">Title</th><th className="th">Approval</th><th className="th">Status</th><th className="th">Deadline</th><th className="th">Applications</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">{list.map((i) => <tr key={i._id}><td className="td"><div className="font-semibold">{i.title}</div><div className="text-xs text-ink-soft">{i.location} · {i.duration} mo · {i.domain}</div></td>
            <td className="td"><Badge tone={APPROVAL[i.approvalStatus]}>{i.approvalStatus}</Badge></td><td className="td"><Badge tone={i.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-black/5 text-ink-soft'}>{i.status}</Badge></td>
            <td className="td"><div>{fmtDate(i.applicationDeadline)}</div><div className="text-xs text-ink-faint">{deadlineInfo(i.applicationDeadline).label}</div></td>
            <td className="td"><Link className="font-semibold text-brand-700" to={`/company/applications?internshipId=${i._id}`}>{i.applicationCount}</Link></td>
            <td className="td"><div className="flex justify-end gap-1"><Link to={`/company/internships/${i._id}/edit`} className="btn btn-ghost btn-sm" aria-label="Edit"><FiEdit2 /></Link><Button variant="ghost" size="sm" onClick={() => toggle(i)}>{i.status === 'active' ? 'Close' : 'Reopen'}</Button><Button variant="ghost" size="sm" aria-label="Delete" onClick={() => remove(i)}><FiTrash2 /></Button></div></td></tr>)}</tbody></table></Card>)}</Async>
    </div>
  );
}
