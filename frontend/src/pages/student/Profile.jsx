import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { errMsg, studentApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, ChipSelect, Field, PageHeader, ProgressBar, Select, TagInput } from '../../components/ui';
import { DEGREES, LOCATIONS, WORK_MODES } from '../../constants';
import { fmtDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export function Profile() {
  const { user } = useAuth();
  const state = useFetch(() => studentApi.profile().then((r) => r.data), []);
  return (
    <div><PageHeader title="My profile" subtitle={user.email} actions={<Link to="/student/profile/edit" className="btn btn-primary"><FiEdit2 />Edit profile</Link>} />
      <Async state={state}>{(p) => (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-3"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Profile completion</span><span className="font-semibold">{p.profileCompletion}%</span></div><ProgressBar value={p.profileCompletion} />
            {p.completionDetails.missing.length > 0 && <p className="mt-3 text-sm text-ink-soft">To reach 100%: {p.completionDetails.missing.join(' · ')}</p>}</Card>
          <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Education</h2><dl className="space-y-2 text-sm">{[['Degree', p.education?.degree], ['Branch', p.education?.branch], ['College', p.education?.college], ['Graduation', p.education?.graduationYear], ['CGPA', p.education?.cgpa]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-soft">{k}</dt><dd className="text-right font-medium">{v ?? '-'}</dd></div>)}</dl></Card>
          <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Preferences</h2><dl className="space-y-3 text-sm">
            <div><dt className="text-ink-soft">Locations</dt><dd className="mt-1 flex flex-wrap gap-1">{p.preferences?.locations?.length ? p.preferences.locations.map((l) => <Badge key={l}>{l}</Badge>) : '-'}</dd></div>
            <div><dt className="text-ink-soft">Work modes</dt><dd className="mt-1 flex flex-wrap gap-1">{p.preferences?.workModes?.length ? p.preferences.workModes.map((l) => <Badge key={l}>{l}</Badge>) : '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Duration</dt><dd className="font-medium">{p.preferences?.durationPreference ? `${p.preferences.durationPreference} months` : '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Min stipend</dt><dd className="font-medium">{p.preferences?.minStipend ? `₹${p.preferences.minStipend}` : '-'}</dd></div></dl></Card>
          <Card className="p-6"><h2 className="mb-3 text-lg font-semibold">Interests</h2><div className="flex flex-wrap gap-1.5">{p.interests?.length ? p.interests.map((i) => <Badge key={i} tone="bg-brand-50 text-brand-700">{i}</Badge>) : <span className="text-sm text-ink-soft">None yet</span>}</div>
            <h2 className="mb-3 mt-6 text-lg font-semibold">Resume</h2>{p.resumeUrl ? <a className="text-sm font-semibold text-brand-700" href={`${import.meta.env.VITE_FILES_URL || 'http://localhost:5000'}${p.resumeUrl}`} target="_blank" rel="noreferrer">View uploaded resume</a> : <Link to="/student/settings" className="text-sm font-semibold text-brand-700">Upload in settings →</Link>}</Card>
          <Card className="p-6 lg:col-span-2"><h2 className="mb-3 flex items-center justify-between text-lg font-semibold">Skills <Link to="/student/skills" className="text-xs font-semibold text-brand-700">Manage →</Link></h2><div className="flex flex-wrap gap-1.5">{p.skills.length ? p.skills.map((s) => <Badge key={s._id} tone="bg-black/5 text-ink">{s.name} · {s.proficiency}</Badge>) : <span className="text-sm text-ink-soft">No skills yet</span>}</div></Card>
          <Card className="p-6"><h2 className="mb-3 flex items-center justify-between text-lg font-semibold">Certifications</h2>{p.certifications.length ? <ul className="space-y-2 text-sm">{p.certifications.map((c) => <li key={c._id}><b>{c.name}</b><div className="text-xs text-ink-soft">{c.issuer} {c.issueDate && `· ${fmtDate(c.issueDate)}`}</div></li>)}</ul> : <span className="text-sm text-ink-soft">None yet</span>}</Card>
        </div>)}</Async>
    </div>
  );
}

export function ProfileEdit() {
  const nav = useNavigate(); const { user, refresh } = useAuth();
  const state = useFetch(() => studentApi.profile().then((r) => r.data), []);
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [cert, setCert] = useState({ name: '', issuer: '', issueDate: '' });
  useEffect(() => { if (state.data) setF({ name: user.name, phone: user.phone || '', education: { degree: '', branch: '', college: '', graduationYear: '', cgpa: '', ...state.data.education }, preferences: { domains: [], locations: [], workModes: [], durationPreference: '', minStipend: '', ...state.data.preferences }, interests: state.data.interests || [] }); }, [state.data]); // eslint-disable-line
  const setEdu = (k) => (e) => setF({ ...f, education: { ...f.education, [k]: e.target.value } });
  const setPref = (k) => (v) => setF({ ...f, preferences: { ...f.preferences, [k]: v } });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const num = (v) => (v === '' || v == null ? '' : Number(v));
      await studentApi.updateProfile({ name: f.name, phone: f.phone, interests: f.interests,
        education: { ...f.education, graduationYear: num(f.education.graduationYear), cgpa: num(f.education.cgpa) },
        preferences: { ...f.preferences, durationPreference: num(f.preferences.durationPreference), minStipend: num(f.preferences.minStipend) } });
      await refresh(); toast.success('Profile updated. Recommendations will refresh.'); nav('/student/profile');
    } catch (ex) { toast.error(errMsg(ex)); } finally { setBusy(false); }
  };
  const addCert = async () => { if (!cert.name) return toast.error('Certification name is required'); try { await studentApi.addCert(cert); setCert({ name: '', issuer: '', issueDate: '' }); await state.reload(true); toast.success('Certification added'); } catch (ex) { toast.error(errMsg(ex)); } };
  const delCert = async (id) => { try { await studentApi.removeCert(id); await state.reload(true); } catch (ex) { toast.error(errMsg(ex)); } };

  return (
    <div><PageHeader title="Edit profile" subtitle="The more complete your profile, the better your matches." />
      <Async state={state}>{(p) => !f ? null : (
        <form onSubmit={save} className="space-y-6">
          <Card className="p-6"><h2 className="mb-4 text-lg font-semibold">Basic & education</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
              <Field label="Degree"><Select options={DEGREES} placeholder="Select" value={f.education.degree} onChange={(v) => setF({ ...f, education: { ...f.education, degree: v } })} /></Field>
              <Field label="Branch"><input className="input" placeholder="e.g. Computer Science" value={f.education.branch} onChange={setEdu('branch')} /></Field>
              <Field label="College"><input className="input" value={f.education.college} onChange={setEdu('college')} /></Field>
              <div className="grid grid-cols-2 gap-4"><Field label="Graduation year"><input className="input" type="number" min="2020" max="2035" value={f.education.graduationYear} onChange={setEdu('graduationYear')} /></Field>
                <Field label="CGPA (0-10)"><input className="input" type="number" step="0.1" min="0" max="10" value={f.education.cgpa} onChange={setEdu('cgpa')} /></Field></div>
            </div></Card>
          <Card className="space-y-5 p-6"><h2 className="text-lg font-semibold">Internship preferences</h2>
            <div><span className="label">Interests / career goals</span><TagInput value={f.interests} onChange={(v) => setF({ ...f, interests: v })} placeholder="e.g. Full Stack Development - press Enter" /></div>
            <div><span className="label">Preferred domains</span><TagInput value={f.preferences.domains} onChange={setPref('domains')} placeholder="e.g. MERN Stack" /></div>
            <div><span className="label">Preferred locations</span><ChipSelect options={LOCATIONS} value={f.preferences.locations} onChange={setPref('locations')} /></div>
            <div><span className="label">Work modes</span><ChipSelect options={WORK_MODES} value={f.preferences.workModes} onChange={setPref('workModes')} /></div>
            <div className="grid gap-4 md:grid-cols-2"><Field label="Preferred duration (months)"><input className="input" type="number" min="1" max="12" value={f.preferences.durationPreference} onChange={(e) => setPref('durationPreference')(e.target.value)} /></Field>
              <Field label="Minimum stipend (₹/month)"><input className="input" type="number" min="0" step="1000" value={f.preferences.minStipend} onChange={(e) => setPref('minStipend')(e.target.value)} /></Field></div></Card>
          <div className="flex gap-3"><Button type="submit" loading={busy}>Save changes</Button><Button type="button" variant="outline" onClick={() => nav('/student/profile')}>Cancel</Button></div>
          <Card className="p-6"><h2 className="mb-4 text-lg font-semibold">Certifications</h2>
            <ul className="mb-4 space-y-2">{p.certifications.map((c) => <li key={c._id} className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-sm"><span><b>{c.name}</b> {c.issuer && <span className="text-ink-soft">- {c.issuer}</span>}</span><button type="button" onClick={() => delCert(c._id)} aria-label="Remove"><FiTrash2 /></button></li>)}</ul>
            <div className="grid gap-3 md:grid-cols-4"><input className="input" placeholder="Certification name" value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} /><input className="input" placeholder="Issuer" value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} /><input className="input" type="date" value={cert.issueDate} onChange={(e) => setCert({ ...cert, issueDate: e.target.value })} /><Button type="button" variant="outline" onClick={addCert}>Add</Button></div></Card>
        </form>)}</Async>
    </div>
  );
}
