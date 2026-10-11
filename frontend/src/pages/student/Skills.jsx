import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiAward, FiTrash2 } from 'react-icons/fi';
import { catalogApi, errMsg, studentApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Button, Card, EmptyState, Field, PageHeader, ProgressBar, Select } from '../../components/ui';
import { PROFICIENCY } from '../../constants';
import { scoreTone } from '../../utils/format';

const STRENGTH = { Beginner: 40, Intermediate: 62, Advanced: 82, Expert: 94 };

export default function Skills() {
  const state = useFetch(() => studentApi.profile().then((r) => r.data), []);
  const catalog = useFetch(() => catalogApi.skills().then((r) => r.data), []);
  const [f, setF] = useState({ name: '', proficiency: 'Intermediate', yearsOfExperience: 1 }); const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await studentApi.addSkill({ ...f, yearsOfExperience: Number(f.yearsOfExperience) }); setF({ ...f, name: '' }); await state.reload(true); toast.success('Skill added'); }
    catch (ex) { toast.error(errMsg(ex)); } finally { setBusy(false); }
  };
  const del = async (s) => { try { await studentApi.removeSkill(s._id); await state.reload(true); toast.success(`${s.name} removed`); } catch (ex) { toast.error(errMsg(ex)); } };
  return (
    <div><PageHeader title="Skills" subtitle="Add at least 3 skills to unlock recommendations. Proficiency affects your match score." />
      <Card className="mb-6 p-5"><form onSubmit={add} className="grid items-end gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <Field label="Skill"><input list="skill-catalog" className="input" required placeholder="e.g. Java, React, Docker" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <datalist id="skill-catalog">{(catalog.data || []).map((s) => <option key={s._id} value={s.name}>{s.category}</option>)}</datalist>
        <Field label="Proficiency"><Select options={PROFICIENCY} value={f.proficiency} onChange={(v) => setF({ ...f, proficiency: v })} /></Field>
        <Field label="Years"><input className="input" type="number" min="0" max="30" step="0.5" value={f.yearsOfExperience} onChange={(e) => setF({ ...f, yearsOfExperience: e.target.value })} /></Field>
        <Button type="submit" loading={busy}>Add skill</Button></form></Card>
      <Async state={state}>{(p) => !p.skills.length ? <EmptyState icon={FiAward} title="No skills added yet" text="Start with the technologies you know best - Java, React, Python, Figma..." /> : (
        <div className="grid gap-3 md:grid-cols-2">{p.skills.map((s) => { const v = Math.min(100, STRENGTH[s.proficiency] + Math.min(s.yearsOfExperience || 0, 3) * 2); return (
          <Card key={s._id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="font-semibold">{s.name}</span><span className={`text-sm font-semibold ${scoreTone(v)}`}>{v}%</span></div><p className="mb-2 text-xs text-ink-soft">{s.category} · {s.proficiency} · {s.yearsOfExperience || 0} yr</p><ProgressBar value={v} /></div>
            <Button variant="ghost" size="sm" aria-label={`Remove ${s.name}`} onClick={() => del(s)}><FiTrash2 /></Button></Card>); })}</div>)}</Async>
    </div>
  );
}
