import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle, FiClock, FiTarget, FiTrash2, FiUserCheck, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { errMsg, notifApi } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Async, Button, Card, EmptyState, PageHeader } from '../components/ui';
import { fmtDateTime } from '../utils/format';

const ICONS = { new_recommendation: [FiTarget, 'bg-brand-50 text-brand-600'], application_update: [FiCheckCircle, 'bg-indigo-50 text-indigo-700'], deadline_warning: [FiClock, 'bg-amber-50 text-amber-600'],
  shortlisted: [FiUserCheck, 'bg-brand-100 text-brand-700'], rejected: [FiXCircle, 'bg-rose-50 text-rose-600'], internship_approval: [FiCheckCircle, 'bg-brand-50 text-brand-600'], new_application: [FiUserCheck, 'bg-indigo-50 text-indigo-700'], internship_pending: [FiAlertTriangle, 'bg-amber-50 text-amber-600'] };
const bump = () => window.dispatchEvent(new Event('notifications-changed'));

export default function Notifications() {
  const nav = useNavigate();
  const state = useFetch(() => notifApi.list(), []);
  const act = async (fn) => { try { await fn(); await state.reload(true); bump(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Recommendations, application updates and deadline alerts" actions={<Button variant="outline" size="sm" onClick={() => act(notifApi.readAll)}>Mark all as read</Button>} />
      <Async state={state}>{(r) => !r.data.length ? <EmptyState icon={FiBell} title="You're all caught up" text="New matches, status changes and deadline alerts will appear here." /> : (
        <div className="space-y-3">{r.data.map((n) => { const [Icon, tone] = ICONS[n.type] || [FiBell, 'bg-black/5 text-ink-soft']; return (
          <Card key={n._id} className={`flex items-start gap-4 p-4 ${n.read ? 'opacity-70' : 'border-brand-500/40'}`}>
            <div className={`rounded-xl p-2.5 ${tone}`}><Icon size={18} /></div>
            <button className="min-w-0 flex-1 text-left" onClick={async () => { if (!n.read) await act(() => notifApi.read(n._id)); if (n.link) nav(n.link); }}>
              <div className="flex items-center gap-2 font-semibold">{n.title}{!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}</div><p className="text-sm text-ink-soft">{n.message}</p><p className="mt-1 text-xs text-ink-faint">{fmtDateTime(n.createdAt)}</p>
            </button>
            <Button variant="ghost" size="sm" aria-label="Delete notification" onClick={() => act(() => notifApi.remove(n._id))}><FiTrash2 /></Button>
          </Card>); })}</div>)}</Async>
    </div>
  );
}
