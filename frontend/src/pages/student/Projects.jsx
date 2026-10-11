import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiGithub, FiLayers, FiTrash2 } from 'react-icons/fi';
import { errMsg, studentApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, EmptyState, Field, PageHeader, TagInput } from '../../components/ui';

const blank = { title: '', description: '', technologies: [], role: '', githubUrl: '' };
export default function Projects() {
  const state = useFetch(() => studentApi.profile().then((r) => r.data), []);
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false);
  const add = async (e) => { e.preventDefault(); setBusy(true); try { await studentApi.addProject(f); setF(blank); await state.reload(true); toast.success('Project added - it now counts toward project relevance'); } catch (ex) { toast.error(errMsg(ex)); } finally { setBusy(false); } };
  const del = async (id) => { try { await studentApi.removeProject(id); await state.reload(true); } catch (ex) { toast.error(errMsg(ex)); } };
  return (
    <div><PageHeader title="Projects" subtitle="Technologies used in your projects increase the project-relevance score (10%)." />
      <Card className="mb-6 p-5"><form onSubmit={add} className="grid gap-4 md:grid-cols-2">
        <Field label="Project title"><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Your role"><input className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></Field>
        <div className="md:col-span-2"><Field label="Description"><textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
        <div><span className="label">Technologies</span><TagInput value={f.technologies} onChange={(v) => setF({ ...f, technologies: v })} placeholder="React, Node.js, MongoDB..." /></div>
        <Field label="GitHub URL"><input className="input" type="url" value={f.githubUrl} onChange={(e) => setF({ ...f, githubUrl: e.target.value })} /></Field>
        <div className="md:col-span-2"><Button type="submit" loading={busy}>Add project</Button></div></form></Card>
      <Async state={state}>{(p) => !p.projects.length ? <EmptyState icon={FiLayers} title="No projects yet" text="Add a project to show employers (and the matching engine) what you have built." /> : (
        <div className="grid gap-4 md:grid-cols-2">{p.projects.map((pr) => (
          <Card key={pr._id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-sans font-semibold">{pr.title}</h3>{pr.role && <p className="text-xs text-ink-soft">{pr.role}</p>}</div><Button variant="ghost" size="sm" aria-label="Delete project" onClick={() => del(pr._id)}><FiTrash2 /></Button></div>
            {pr.description && <p className="mt-2 text-sm text-ink-soft">{pr.description}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{pr.technologies.map((t) => <Badge key={t} tone="bg-brand-50 text-brand-700">{t}</Badge>)}</div>
            {pr.githubUrl && <a href={pr.githubUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><FiGithub />Repository</a>}</Card>))}</div>)}</Async>
    </div>
  );
}
