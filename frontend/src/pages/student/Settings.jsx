import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUpload } from 'react-icons/fi';
import { errMsg, studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, PageHeader } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';

export default function Settings() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const file = useRef();
  const [text, setText] = useState(''); const [found, setFound] = useState(null); const [busy, setBusy] = useState('');
  const act = useFetch(() => studentApi.activity().then((r) => r.data), []);
  const upload = async () => {
    const f = file.current.files[0]; if (!f) return toast.error('Choose a file first');
    setBusy('upload'); try { await studentApi.uploadResume(f); toast.success('Resume uploaded'); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const parse = async (apply) => {
    setBusy('parse'); try { const r = await studentApi.parseResume({ text, apply }); setFound(r.data); if (apply) { toast.success('Profile updated from resume text'); act.reload(true); } } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  return (
    <div className="space-y-6"><PageHeader title="Settings" />
      <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Account</h2><dl className="grid gap-2 text-sm md:grid-cols-2"><div><dt className="text-ink-soft">Name</dt><dd className="font-medium">{user.name}</dd></div><div><dt className="text-ink-soft">Email</dt><dd className="font-medium">{user.email}</dd></div></dl>
        <Button variant="outline" className="mt-4" onClick={() => { logout(); nav('/'); }}>Log out</Button></Card>
      <Card className="p-6"><h2 className="mb-1 text-lg font-semibold">Resume</h2><p className="mb-4 text-sm text-ink-soft">Upload a PDF, DOC, DOCX or TXT (max 2 MB). Skills can be auto-extracted from pasted resume text; if it doesn't work, add them manually.</p>
        <div className="flex flex-wrap items-center gap-3"><input ref={file} type="file" accept=".pdf,.doc,.docx,.txt" className="text-sm" /><Button variant="outline" loading={busy === 'upload'} onClick={upload}><FiUpload />Upload</Button></div>
        <textarea className="input mt-5" rows={6} placeholder="Paste your resume text here to detect skills, CGPA and graduation year..." value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex gap-2"><Button variant="outline" size="sm" loading={busy === 'parse'} disabled={text.length < 20} onClick={() => parse(false)}>Preview detected skills</Button><Button size="sm" disabled={text.length < 20 || !found} onClick={() => parse(true)}>Add to my profile</Button></div>
        {found && <div className="mt-4 text-sm"><p className="mb-2 text-ink-soft">Detected {found.skills.length} skills{found.cgpa && ` · CGPA ${found.cgpa}`}{found.graduationYear && ` · ${found.graduationYear}`}</p><div className="flex flex-wrap gap-1.5">{found.skills.map((s) => <Badge key={s.name} tone="bg-brand-50 text-brand-700">{s.name}</Badge>)}</div></div>}</Card>
      <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Recent activity</h2><Async state={act} skeleton={<div className="skeleton h-16 rounded-lg" />}>{(a) => !a.length ? <p className="text-sm text-ink-soft">No activity yet.</p> : <ul className="divide-y divide-line text-sm">{a.slice(0, 12).map((x) => <li key={x._id} className="flex justify-between py-2"><span>{x.action.replace(/_/g, ' ')}{x.meta?.title && ` - ${x.meta.title}`}{x.meta?.name && ` - ${x.meta.name}`}</span><span className="text-xs text-ink-faint">{fmtDateTime(x.createdAt)}</span></li>)}</ul>}</Async></Card>
    </div>
  );
}
