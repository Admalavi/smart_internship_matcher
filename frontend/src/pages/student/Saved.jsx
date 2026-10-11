import toast from 'react-hot-toast';
import { FiBookmark } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { errMsg, savedApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, CardSkeleton, EmptyState, PageHeader } from '../../components/ui';
import InternshipCard from '../../components/InternshipCard';

export default function Saved() {
  const state = useFetch(() => savedApi.list().then((r) => r.data), []);
  const unsave = async (i) => { try { await savedApi.unsave(i._id); toast.success('Removed from saved'); state.reload(true); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div><PageHeader title="Saved internships" subtitle="Deadline alerts are generated for saved internships." />
      <Async state={state} skeleton={<CardSkeleton n={3} />}>{(list) => !list.length ? <EmptyState icon={FiBookmark} title="Nothing saved yet" text="Tap Save on any internship to keep it here." action={<Link to="/internships" className="btn btn-primary">Browse internships</Link>} />
        : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((s) => <InternshipCard key={s.internship._id} internship={s.internship} canSave onSave={unsave} />)}</div>}</Async>
    </div>
  );
}
