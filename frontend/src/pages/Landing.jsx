import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiCheckCircle, FiClipboard, FiTarget, FiUser, FiZap } from 'react-icons/fi';
import { catalogApi } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Async, Card, Skeleton } from '../components/ui';
import InternshipCard from '../components/InternshipCard';
import { useAuth, homeFor } from '../context/AuthContext';

const STEPS = [
  [FiUser, 'Build your profile', 'Add skills with proficiency, projects, certifications and your preferences.'],
  [FiTarget, 'Get a weighted match score', 'Skills, eligibility, domain, location, duration and projects are scored from real data.'],
  [FiBarChart2, 'See your skill gaps', 'Critical, moderate and minor gaps - each with a learning path.'],
  [FiClipboard, 'Apply and track', 'A Kanban tracker follows every application from Applied to Selected.'],
];

export default function Landing() {
  const { user } = useAuth();
  const stats = useFetch(() => catalogApi.stats().then((r) => r.data), []);
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-12 md:grid-cols-[1.2fr_1fr] md:pt-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-semibold leading-[1.1] md:text-6xl">Find internships that match you, and know exactly why.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">Discover opportunities based on your skills, interests, eligibility and career goals. Every recommendation comes with an explanation and a plan to close the gap.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? homeFor(user.role) : '/register'} className="btn btn-primary px-6 py-3">Find My Internship</Link>
            <Link to="/internships" className="btn btn-outline px-6 py-3">Explore Opportunities</Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Card className="p-6">
            <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><FiTarget size={26} /></div><div><div className="font-semibold">Every match comes with reasons</div><div className="text-sm text-ink-soft">What an explanation looks like</div></div></div>
            <ul className="mt-5 space-y-2 text-sm">
              {['Java matched', 'React matched', 'MongoDB matched', 'Pune matches your location', '6-month duration matches'].map((t) => <li key={t} className="flex gap-2"><FiCheckCircle className="mt-0.5 text-brand-600" />{t}</li>)}
              <li className="flex gap-2 text-amber-600"><FiZap className="mt-0.5" />Skill gap: Spring Boot - learn REST APIs first</li>
            </ul>
          </Card>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <Async state={stats} skeleton={<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}>
          {(d) => (<>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[[d.internships, 'Open internships'], [d.companies, 'Companies'], [d.students, 'Students'], [d.applications, 'Applications tracked']].map(([v, l]) => (
                <Card key={l} className="p-5 text-center"><div className="font-display text-3xl font-semibold">{v}</div><div className="text-sm text-ink-soft">{l}</div></Card>
              ))}
            </div>
            <h2 className="mb-5 mt-16 text-2xl font-semibold md:text-3xl">Featured opportunities</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{d.featured.map((i) => <InternshipCard key={i._id} internship={i} />)}</div>
          </>)}
        </Async>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map(([Icon, t, d], i) => (<Card key={t} className="p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></div><div className="mb-1 text-xs font-semibold text-ink-faint">Step {i + 1}</div><h3 className="font-sans font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-soft">{d}</p></Card>))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <Card className="bg-ink p-10 text-center text-white">
          <h2 className="text-3xl font-semibold">Stop guessing. Start matching.</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/70">Create a free profile and see your personalised ranking in under two minutes.</p>
          <Link to="/register" className="btn mt-6 bg-white px-6 py-3 text-ink hover:bg-paper">Create my profile</Link>
        </Card>
      </section>
    </div>
  );
}
