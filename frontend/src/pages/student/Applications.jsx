import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClipboard } from 'react-icons/fi';
import { appApi, errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, EmptyState, Modal, PageHeader } from '../../components/ui';
import { MatchPill } from '../../components/match';
import { KANBAN, STATUS_TONE } from '../../constants';
import { fmtDate, fmtDateTime } from '../../utils/format';

export default function Applications() {
  const state = useFetch(() => appApi.list(), []);
  const [sel, setSel] = useState(null); const [busy, setBusy] = useState(false);
  const withdraw = async () => {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return;
    setBusy(true); try { await appApi.setStatus(sel._id, 'Withdrawn', 'Withdrawn by student'); toast.success('Application withdrawn'); setSel(null); state.reload(true); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const Card_ = ({ a }) => (
    <button onClick={() => setSel(a)} className="w-full rounded-xl border border-line bg-white p-3 text-left shadow-card transition hover:border-ink-faint">
      <div className="text-sm font-semibold leading-snug">{a.snapshot?.internshipTitle || a.internshipId?.title}</div><div className="text-xs text-ink-soft">{a.snapshot?.companyName}</div>
      <div className="mt-2 flex items-center justify-between"><MatchPill score={a.matchScore} /><span className="text-[11px] text-ink-faint">{fmtDate(a.appliedAt)}</span></div>
    </button>
  );
  return (
    <div><PageHeader title="Application tracker" subtitle="Click a card to see its full history." />
      <Async state={state}>{(r) => !r.data.length ? <EmptyState icon={FiClipboard} title="No applications yet" text="Apply to an internship and track every stage here." action={<Link to="/student/recommendations" className="btn btn-primary">See recommendations</Link>} /> : (<>
        <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">{KANBAN.map((s) => (
          <div key={s} className="min-w-[13rem] rounded-2xl bg-black/[.04] p-3"><div className="mb-3 flex items-center justify-between"><Badge tone={STATUS_TONE[s]}>{s}</Badge><span className="text-xs font-semibold text-ink-soft">{r.grouped[s].length}</span></div>
            <div className="space-y-2">{r.grouped[s].map((a) => <Card_ key={a._id} a={a} />)}{!r.grouped[s].length && <p className="py-4 text-center text-xs text-ink-faint">Empty</p>}</div></div>))}</div>
        {(r.grouped.Rejected.length > 0 || r.grouped.Withdrawn.length > 0) && <div className="mt-6 grid gap-4 md:grid-cols-2">{['Rejected', 'Withdrawn'].map((s) => (
          <div key={s} className="rounded-2xl bg-black/[.04] p-3"><div className="mb-3 flex items-center justify-between"><Badge tone={STATUS_TONE[s]}>{s}</Badge><span className="text-xs font-semibold text-ink-soft">{r.grouped[s].length}</span></div><div className="grid gap-2 sm:grid-cols-2">{r.grouped[s].map((a) => <Card_ key={a._id} a={a} />)}</div></div>))}</div>}
      </>)}</Async>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.snapshot?.internshipTitle || 'Application'}>
        {sel && <div><p className="text-sm text-ink-soft">{sel.snapshot?.companyName} · {sel.internshipId?.location}</p><div className="my-3 flex items-center gap-2"><Badge tone={STATUS_TONE[sel.status]}>{sel.status}</Badge><MatchPill score={sel.matchScore} /></div>
          <ol className="relative ml-2 space-y-4 border-l border-line pl-5">{sel.statusHistory.map((h, i) => <li key={i}><span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-600" /><div className="text-sm font-semibold">{h.status}</div><div className="text-xs text-ink-soft">{fmtDateTime(h.changedAt)}</div>{h.note && <div className="text-xs text-ink-soft">{h.note}</div>}</li>)}</ol>
          <div className="mt-6 flex gap-2">{sel.internshipId?._id && <Link to={`/internships/${sel.internshipId._id}`} className="btn btn-outline btn-sm">View internship</Link>}{!['Selected', 'Rejected', 'Withdrawn'].includes(sel.status) && <Button variant="danger" size="sm" loading={busy} onClick={withdraw}>Withdraw</Button>}</div></div>}
      </Modal>
    </div>
  );
}
