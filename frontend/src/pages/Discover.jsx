import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { errMsg, internshipApi, savedApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { Button, Card, CardSkeleton, ChipSelect, EmptyState, ErrorState, PageHeader, Pagination, Select } from '../components/ui';
import InternshipCard from '../components/InternshipCard';
import { WORK_MODES } from '../constants';

const SORTS = [['match', 'Best Match'], ['newest', 'Newest'], ['deadline', 'Deadline Soon'], ['stipend', 'Highest Stipend']];
const init = { q: '', domain: [], location: [], workMode: [], minStipend: '', maxDuration: '', sort: 'newest', excludeApplied: false, page: 1 };

export default function Discover() {
  const { user } = useAuth(); const nav = useNavigate();
  const isStudent = user?.role === 'student';
  const [f, setF] = useState({ ...init, sort: isStudent ? 'match' : 'newest' });
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const facets = useFetch(() => internshipApi.facets().then((r) => r.data), []);
  const [state, setState] = useState({ loading: true, error: null, items: [], meta: null });

  useEffect(() => { const t = setTimeout(() => setF((x) => ({ ...x, q, page: 1 })), 350); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = { q: f.q || undefined, domain: f.domain.join(',') || undefined, location: f.location.join(',') || undefined, workMode: f.workMode.join(',') || undefined,
        minStipend: f.minStipend || undefined, maxDuration: f.maxDuration || undefined, sort: f.sort, page: f.page, limit: 9, excludeApplied: f.excludeApplied || undefined };
      const r = await internshipApi.list(params);
      setState({ loading: false, error: null, items: r.data, meta: r.meta });
    } catch (e) { setState({ loading: false, error: errMsg(e), items: [], meta: null }); }
  }, [f]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v, page: 1 }));
  const toggleSave = async (i) => {
    try {
      if (i.saved) await savedApi.unsave(i._id); else await savedApi.save(i._id);
      setState((s) => ({ ...s, items: s.items.map((x) => (x._id === i._id ? { ...x, saved: !x.saved } : x)) }));
      toast.success(i.saved ? 'Removed from saved' : 'Saved');
    } catch (e) { toast.error(errMsg(e)); }
  };
  const d = facets.data || { domains: [], locations: [] };
  const sorts = SORTS.filter(([k]) => k !== 'match' || isStudent);

  const filters = (
    <Card className="space-y-5 p-5">
      <div><span className="label">Domain</span><ChipSelect options={d.domains} value={f.domain} onChange={set('domain')} /></div>
      <div><span className="label">Location</span><ChipSelect options={d.locations} value={f.location} onChange={set('location')} /></div>
      <div><span className="label">Work mode</span><ChipSelect options={WORK_MODES} value={f.workMode} onChange={set('workMode')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><span className="label">Min stipend (₹)</span><input type="number" min="0" step="1000" className="input" value={f.minStipend} onChange={(e) => set('minStipend')(e.target.value)} /></div>
        <div><span className="label">Max duration (mo)</span><input type="number" min="1" max="12" className="input" value={f.maxDuration} onChange={(e) => set('maxDuration')(e.target.value)} /></div>
      </div>
      {isStudent && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.excludeApplied} onChange={(e) => set('excludeApplied')(e.target.checked)} />Hide internships I applied to</label>}
      <Button variant="outline" size="sm" onClick={() => { setQ(''); setF({ ...init, sort: f.sort }); }}>Clear filters</Button>
    </Card>
  );

  return (
    <div className={user ? '' : 'mx-auto max-w-7xl px-4 py-10'}>
      <PageHeader title="Discover internships" subtitle={state.meta ? `${state.meta.total} opportunit${state.meta.total === 1 ? 'y' : 'ies'} found${state.meta.searchMode === 'regex-fallback' ? ' (partial-word search)' : ''}` : 'Search by role, skill, domain or city'} />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[16rem] flex-1"><FiSearch className="absolute left-3 top-3 text-ink-faint" /><input className="input pl-9" placeholder='Try "Java developer", "Remote Python internship", "Pune"' value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search internships" /></div>
        <div className="w-48"><Select options={sorts.map(([v, l]) => ({ value: v, label: l }))} value={f.sort} onChange={set('sort')} aria-label="Sort" /></div>
        <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}><FiFilter />Filters</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>{filters}</aside>
        <div>
          {state.loading ? <CardSkeleton n={6} /> : state.error ? <ErrorState message={state.error} onRetry={load} />
            : !state.items.length ? <EmptyState icon={FiSearch} title="No internships match your search" text="Try removing a filter or searching for a broader term." action={<Button variant="outline" onClick={() => { setQ(''); setF({ ...init, sort: f.sort }); }}>Reset search</Button>} />
            : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{state.items.map((i) => <InternshipCard key={i._id} internship={i} canSave={isStudent} onSave={toggleSave} />)}</div>}
          <Pagination meta={state.meta} onPage={(p) => { setF((x) => ({ ...x, page: p })); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>
      {!user && <p className="mt-8 text-center text-sm text-ink-soft"><button className="font-semibold text-brand-700" onClick={() => nav('/login')}>Log in</button> as a student to see your match score on every card.</p>}
    </div>
  );
}
