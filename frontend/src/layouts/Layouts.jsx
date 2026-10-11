import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiAward, FiBarChart2, FiBell, FiBook, FiBookmark, FiBriefcase, FiCheckSquare, FiGrid, FiHome, FiLayers, FiLogOut, FiMenu, FiPlusCircle, FiSearch, FiSettings, FiStar, FiTarget, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { homeFor, useAuth } from '../context/AuthContext';
import { notifApi } from '../services/api';
import { cx } from '../components/ui';
import { initials } from '../utils/format';

export const Logo = ({ to = '/' }) => (
  <Link to={to} className="flex items-center gap-2 font-display text-lg font-bold">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><FiTarget /></span>Smart Internship Matcher
  </Link>
);

export function PublicNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const links = [['/internships', 'Browse'], ['/about', 'About']];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map(([to, l]) => <NavLink key={to} to={to} className={({ isActive }) => cx('text-sm font-medium', isActive ? 'text-brand-700' : 'text-ink-soft hover:text-ink')}>{l}</NavLink>)}
          {user ? (<><Link to={homeFor(user.role)} className="btn btn-primary btn-sm">Dashboard</Link><button className="text-sm text-ink-soft" onClick={() => { logout(); nav('/'); }}>Logout</button></>)
            : (<><Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">Login</Link><Link to="/register" className="btn btn-primary btn-sm">Get started</Link></>)}
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <FiX size={22} /> : <FiMenu size={22} />}</button>
      </div>
      {open && <div className="space-y-3 border-t border-line px-4 py-4 md:hidden" onClick={() => setOpen(false)}>
        {links.map(([to, l]) => <Link key={to} to={to} className="block text-sm font-medium">{l}</Link>)}
        {user ? <Link to={homeFor(user.role)} className="btn btn-primary w-full">Dashboard</Link> : <><Link to="/login" className="btn btn-outline w-full">Login</Link><Link to="/register" className="btn btn-primary w-full">Get started</Link></>}
      </div>}
    </header>
  );
}

export const PublicFooter = () => (
  <footer className="mt-20 border-t border-line py-8 text-center text-sm text-ink-soft">
    <p>Smart Internship Matcher - A NoSQL-Based Personalized Internship Recommendation and Skill-Gap Analysis System</p>
    <p className="mt-1 text-xs text-ink-faint">M.Tech NoSQL Database mini-project · MongoDB · Express · React · Node</p>
  </footer>
);

export const PublicLayout = () => (
  <div className="min-h-screen"><PublicNav /><main><Outlet /></main><PublicFooter /></div>
);

const MENUS = {
  student: [
    ['/student', 'Dashboard', FiHome, true], ['/internships', 'Discover', FiSearch], ['/student/recommendations', 'Recommendations', FiStar],
    ['/student/skill-gaps', 'Skill Gaps', FiBarChart2], ['/student/learning', 'Learning Paths', FiBook], ['/student/saved', 'Saved', FiBookmark],
    ['/student/applications', 'Applications', FiCheckSquare], ['/student/profile', 'Profile', FiUser], ['/student/skills', 'Skills', FiAward],
    ['/student/projects', 'Projects', FiLayers], ['/student/notifications', 'Notifications', FiBell], ['/student/settings', 'Settings', FiSettings],
  ],
  company: [
    ['/company', 'Dashboard', FiHome, true], ['/company/internships', 'My Internships', FiBriefcase], ['/company/internships/new', 'Post Internship', FiPlusCircle],
    ['/company/applications', 'Applications', FiUsers], ['/company/profile', 'Company Profile', FiUser], ['/company/notifications', 'Notifications', FiBell],
  ],
  admin: [
    ['/admin', 'Dashboard', FiHome, true], ['/admin/analytics', 'Analytics', FiBarChart2], ['/admin/skills', 'Skill Analytics', FiAward], ['/admin/students', 'Students', FiUsers],
    ['/admin/companies', 'Companies', FiBriefcase], ['/admin/internships', 'Internships', FiGrid], ['/admin/applications', 'Applications', FiCheckSquare], ['/admin/notifications', 'Notifications', FiBell],
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () => notifApi.unread().then((r) => live && setUnread(r.data.unread)).catch(() => {});
    load(); const t = setInterval(load, 60000);
    window.addEventListener('notifications-changed', load);
    return () => { live = false; clearInterval(t); window.removeEventListener('notifications-changed', load); };
  }, []);
  const menu = MENUS[user.role] || [];
  const side = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo to={homeFor(user.role)} /></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {menu.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-black/5')}>
            <Icon size={17} />{label}{label === 'Notifications' && unread > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <div className="mb-3 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{initials(user.name)}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{user.name}</div><div className="text-xs capitalize text-ink-faint">{user.role}</div></div></div>
        <button onClick={() => { logout(); nav('/'); }} className="btn btn-outline w-full btn-sm"><FiLogOut />Logout</button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-white lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} /><aside className="absolute left-0 top-0 h-full w-72 bg-white">{side}</aside></div>}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden"><button onClick={() => setOpen(true)} aria-label="Open menu"><FiMenu size={22} /></button><Logo to={homeFor(user.role)} /><Link to={`/${user.role}/notifications`} className="relative"><FiBell size={20} />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread}</span>}</Link></div>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8"><Outlet /></main>
      </div>
    </div>
  );
}

/** Shared pages (browse / details) use the dashboard shell when logged in, the public shell otherwise. */
export function AdaptiveLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <DashboardLayout /> : <PublicLayout />;
}
