import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { errMsg, internshipApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Button, Card, ChipSelect, Field, LinkBack, PageHeader, PageSkeleton, Select, TagInput } from '../../components/ui';
import { IMPORTANCE, LOCATIONS, WORK_MODES } from '../../constants';

const blank = { title: '', description: '', domain: '', location: 'Pune', workMode: 'Hybrid', duration: 6, openings: 1, applicationDeadline: '', status: 'active',
  requiredSkills: [{ name: '', importance: 'High' }], preferredSkills: [], tags: [], responsibilities: [], benefits: [],
  stipend: { min: 10000, max: 15000, currency: 'INR' }, eligibility: { minCGPA: 0, branches: [], graduationYears: [], requiredDegree: 'Any' }, custom: [] };

export default function InternshipForm() {
  const { id } = useParams(); const nav = useNavigate(); const edit = !!id;
  const loaded = useFetch(async () => (edit ? (await internshipApi.one(id)).data : null), [id]);
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const i = loaded.data; if (!i) return;
    setF({ ...blank, ...i, applicationDeadline: i.applicationDeadline?.slice(0, 10), eligibility: { ...blank.eligibility, ...i.eligibility, graduationYears: (i.eligibility?.graduationYears || []).map(String) },
      custom: Object.entries(i.customFields || {}).map(([k, v]) => ({ k, v: Array.isArray(v) ? v.join(', ') : String(v) })) });
  }, [loaded.data]);

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const inp = (k) => (e) => set(k)(e.target.value);
  const setSkill = (idx, patch) => set('requiredSkills')(f.requiredSkills.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const setEl = (k, v) => setF((x) => ({ ...x, eligibility: { ...x.eligibility, [k]: v } }));
  const setSt = (k, v) => setF((x) => ({ ...x, stipend: { ...x.stipend, [k]: Number(v) } }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const customFields = {}; f.custom.filter((c) => c.k.trim()).forEach((c) => { customFields[c.k.trim()] = c.v.includes(',') ? c.v.split(',').map((x) => x.trim()) : c.v === 'true' ? true : c.v === 'false' ? false : c.v; });
      const body = { title: f.title, description: f.description, domain: f.domain, location: f.location, workMode: f.workMode, duration: Number(f.duration), openings: Number(f.openings), applicationDeadline: f.applicationDeadline, status: f.status,
        requiredSkills: f.requiredSkills.filter((s) => s.name.trim()), preferredSkills: f.preferredSkills, tags: f.tags, responsibilities: f.responsibilities, benefits: f.benefits, stipend: f.stipend,
        eligibility: { ...f.eligibility, minCGPA: Number(f.eligibility.minCGPA), graduationYears: f.eligibility.graduationYears.map(Number).filter(Boolean) }, customFields };
      if (edit) { await internshipApi.update(id, body); toast.success('Internship updated'); } else { const r = await internshipApi.create(body); toast.success(r.message || 'Internship created'); }
      nav('/company/internships');
    } catch (ex) { toast.error(errMsg(ex)); } finally { setBusy(false); }
  };

  return (
    <div><LinkBack to="/company/internships" label="My internships" /><PageHeader title={edit ? 'Edit internship' : 'Post a new internship'} subtitle="New postings are reviewed by the placement office before students can see them." />
      <Async state={loaded} skeleton={<PageSkeleton />}>{() => (
        <form onSubmit={submit} className="space-y-6">
          <Card className="grid gap-4 p-6 md:grid-cols-2"><div className="md:col-span-2"><Field label="Title"><input className="input" required value={f.title} onChange={inp('title')} placeholder="e.g. Java Full Stack Developer Intern" /></Field></div>
            <Field label="Domain"><input className="input" required value={f.domain} onChange={inp('domain')} placeholder="e.g. Java Development" /></Field>
            <Field label="Application deadline"><input className="input" type="date" required value={f.applicationDeadline} onChange={inp('applicationDeadline')} /></Field>
            <Field label="Location"><input list="locs" className="input" required value={f.location} onChange={inp('location')} /></Field><datalist id="locs">{LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist>
            <Field label="Work mode"><Select options={WORK_MODES} value={f.workMode} onChange={set('workMode')} /></Field>
            <Field label="Duration (months)"><input className="input" type="number" min="1" max="12" required value={f.duration} onChange={inp('duration')} /></Field><Field label="Openings"><input className="input" type="number" min="1" value={f.openings} onChange={inp('openings')} /></Field>
            <Field label="Stipend min (₹/mo)"><input className="input" type="number" min="0" step="500" value={f.stipend.min} onChange={(e) => setSt('min', e.target.value)} /></Field><Field label="Stipend max (₹/mo)"><input className="input" type="number" min="0" step="500" value={f.stipend.max} onChange={(e) => setSt('max', e.target.value)} /></Field>
            {edit && <Field label="Status"><Select options={['active', 'closed']} value={f.status} onChange={set('status')} /></Field>}
            <div className="md:col-span-2"><Field label="Description"><textarea className="input" rows={4} required value={f.description} onChange={inp('description')} /></Field></div></Card>

          <Card className="p-6"><h2 className="mb-1 text-lg font-semibold">Required skills</h2><p className="mb-4 text-xs text-ink-soft">High-importance skills contribute 3x, medium 2x and low 1x to the match score.</p>
            <div className="space-y-2">{f.requiredSkills.map((s, i) => (
              <div key={i} className="flex gap-2"><input className="input flex-1" placeholder="Skill name" value={s.name} onChange={(e) => setSkill(i, { name: e.target.value })} /><div className="w-36"><Select options={IMPORTANCE} value={s.importance} onChange={(v) => setSkill(i, { importance: v })} /></div>
                <Button type="button" variant="ghost" aria-label="Remove skill" disabled={f.requiredSkills.length === 1} onClick={() => set('requiredSkills')(f.requiredSkills.filter((_, x) => x !== i))}><FiTrash2 /></Button></div>))}</div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => set('requiredSkills')([...f.requiredSkills, { name: '', importance: 'Medium' }])}><FiPlus />Add Required Skill</Button>
            <div className="mt-5"><span className="label">Preferred skills</span><TagInput value={f.preferredSkills} onChange={set('preferredSkills')} placeholder="Docker, TypeScript..." /></div></Card>

          <Card className="grid gap-4 p-6 md:grid-cols-2"><h2 className="text-lg font-semibold md:col-span-2">Eligibility</h2>
            <Field label="Minimum CGPA"><input className="input" type="number" min="0" max="10" step="0.1" value={f.eligibility.minCGPA} onChange={(e) => setEl('minCGPA', e.target.value)} /></Field>
            <Field label="Required degree" hint="Use 'Any' to accept all degrees"><input className="input" value={f.eligibility.requiredDegree} onChange={(e) => setEl('requiredDegree', e.target.value)} /></Field>
            <div><span className="label">Allowed branches (empty = all)</span><TagInput value={f.eligibility.branches} onChange={(v) => setEl('branches', v)} placeholder="Computer Science" /></div>
            <div><span className="label">Graduation years (empty = any)</span><TagInput value={f.eligibility.graduationYears} onChange={(v) => setEl('graduationYears', v)} placeholder="2026" /></div></Card>

          <Card className="space-y-4 p-6"><h2 className="text-lg font-semibold">Details</h2>
            <div><span className="label">Responsibilities</span><TagInput value={f.responsibilities} onChange={set('responsibilities')} placeholder="Press Enter after each item" /></div>
            <div><span className="label">Benefits</span><TagInput value={f.benefits} onChange={set('benefits')} placeholder="Certificate, PPO..." /></div>
            <div><span className="label">Tags (used in search)</span><TagInput value={f.tags} onChange={set('tags')} placeholder="java, full stack..." /></div></Card>

          <Card className="p-6"><h2 className="mb-1 text-lg font-semibold">Custom attributes <span className="text-xs font-normal text-ink-faint">(flexible schema)</span></h2><p className="mb-3 text-xs text-ink-soft">Different internships can store different fields, e.g. portfolioRequired = true, tools = Figma, Sketch.</p>
            {f.custom.map((c, i) => <div key={i} className="mb-2 flex gap-2"><input className="input" placeholder="key" value={c.k} onChange={(e) => set('custom')(f.custom.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} /><input className="input" placeholder="value (comma-separate lists)" value={c.v} onChange={(e) => set('custom')(f.custom.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} /><Button type="button" variant="ghost" onClick={() => set('custom')(f.custom.filter((_, j) => j !== i))}><FiTrash2 /></Button></div>)}
            <Button type="button" variant="outline" size="sm" onClick={() => set('custom')([...f.custom, { k: '', v: '' }])}><FiPlus />Add attribute</Button></Card>

          <div className="flex gap-3"><Button type="submit" loading={busy}>{edit ? 'Save changes' : 'Submit for approval'}</Button><Button type="button" variant="outline" onClick={() => nav('/company/internships')}>Cancel</Button></div>
        </form>)}</Async>
    </div>
  );
}
