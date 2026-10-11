import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { companyApi, errMsg, FILES_URL } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, Field, PageHeader } from '../../components/ui';
import { fileUrl, initials } from '../../utils/format';

export default function CompanyProfile() {
  const state = useFetch(() => companyApi.profile().then((r) => r.data), []);
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const logo = useRef();
  useEffect(() => { if (state.data) setF(state.data); }, [state.data]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setBusy(true); try { await companyApi.updateProfile(f); toast.success('Company profile saved'); state.reload(true); } catch (ex) { toast.error(errMsg(ex)); } finally { setBusy(false); } };
  const upload = async () => { const file = logo.current.files[0]; if (!file) return; try { await companyApi.uploadLogo(file); toast.success('Logo updated'); state.reload(true); } catch (ex) { toast.error(errMsg(ex)); } };
  return (
    <div><PageHeader title="Company profile" />
      <Async state={state}>{(c) => !f ? null : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Card className="p-6 text-center">{c.logo ? <img src={fileUrl(c.logo, FILES_URL)} alt="Logo" className="mx-auto h-24 w-24 rounded-2xl object-cover" /> : <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-ink font-display text-2xl text-white">{initials(c.companyName)}</div>}
            <h2 className="mt-3 font-sans font-semibold">{c.companyName}</h2><Badge className="mt-2" tone={c.verified ? 'bg-brand-100 text-brand-700' : 'bg-amber-50 text-amber-600'}>{c.verified ? '✔ Verified' : 'Pending verification'}</Badge>
            <input ref={logo} type="file" accept="image/png,image/jpeg,image/webp" className="mt-4 w-full text-xs" onChange={upload} /></Card>
          <Card className="p-6"><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field label="Company name"><input className="input" required value={f.companyName || ''} onChange={set('companyName')} /></Field><Field label="Industry"><input className="input" value={f.industry || ''} onChange={set('industry')} /></Field>
            <Field label="Website"><input className="input" value={f.website || ''} onChange={set('website')} /></Field><Field label="Location"><input className="input" value={f.location || ''} onChange={set('location')} /></Field>
            <Field label="Company size"><input className="input" placeholder="e.g. 51-200" value={f.companySize || ''} onChange={set('companySize')} /></Field>
            <div className="md:col-span-2"><Field label="Description"><textarea className="input" rows={4} value={f.description || ''} onChange={set('description')} /></Field></div>
            <div className="md:col-span-2"><Button type="submit" loading={busy}>Save profile</Button></div></form></Card>
        </div>)}</Async>
    </div>
  );
}
