import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { homeFor, useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Button, Card, Field } from '../components/ui';

const DEMOS = [['Student (Java)', 'student@example.com', 'Student@123'], ['Student (MERN)', 'student2@example.com', 'Student@123'], ['Student (ML)', 'student3@example.com', 'Student@123'], ['Student (UI/UX)', 'student4@example.com', 'Student@123'], ['Company', 'company@example.com', 'Company@123'], ['Admin', 'admin@example.com', 'Admin@123']];

const Shell = ({ title, subtitle, children }) => (
  <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12"><Card className="w-full p-7"><h1 className="text-2xl font-semibold">{title}</h1><p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>{children}</Card></div>
);

export function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(f.email, f.password); toast.success(`Welcome back, ${u.name.split(' ')[0]}!`); nav(loc.state?.from || homeFor(u.role), { replace: true }); }
    catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Welcome back" subtitle="Log in to see your matches.">
      {new URLSearchParams(loc.search).get('expired') && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-600">Your session expired. Please log in again.</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{err}</p>}
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">New here? <Link to="/register" className="font-semibold text-brand-700">Create an account</Link></p>
      <div className="mt-6 border-t border-line pt-4"><p className="mb-2 text-xs font-semibold text-ink-faint">Demo accounts (after seeding)</p>
        <div className="flex flex-wrap gap-2">{DEMOS.map(([l, e, p]) => <button key={e} type="button" className="btn btn-outline btn-sm" onClick={() => setF({ email: e, password: p })}>{l}</button>)}</div></div>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ role: 'student', name: '', email: '', password: '', companyName: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await register(f); toast.success('Account created!'); nav(u.role === 'student' ? '/student/profile/edit' : homeFor(u.role), { replace: true }); }
    catch (ex) { setErr(errMsg(ex)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" subtitle="Takes less than a minute.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-black/5 p-1">
        {['student', 'company'].map((r) => <button key={r} type="button" onClick={() => setF({ ...f, role: r })} className={`rounded-md py-2 text-sm font-semibold capitalize ${f.role === r ? 'bg-white shadow-card' : 'text-ink-soft'}`}>{r === 'company' ? 'Company / Recruiter' : 'Student'}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input className="input" required value={f.name} onChange={set('name')} /></Field>
        {f.role === 'company' && <Field label="Company name"><input className="input" required value={f.companyName} onChange={set('companyName')} /></Field>}
        <Field label="Email"><input className="input" type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" hint="At least 8 characters with letters and numbers"><input className="input" type="password" required minLength={8} value={f.password} onChange={set('password')} /></Field>
        {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{err}</p>}
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">Already registered? <Link to="/login" className="font-semibold text-brand-700">Log in</Link></p>
    </Shell>
  );
}
