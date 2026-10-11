import { Link } from 'react-router-dom';
import { FiBook, FiCheckCircle } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { recApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Card, ChartCard, EmptyState, PageHeader } from '../../components/ui';
import { LearningPath, SeverityBadge } from '../../components/match';

export function SkillGaps() {
  const state = useFetch(() => recApi.gaps().then((r) => r.data), []);
  return (
    <div><PageHeader title="Skill gap analysis" subtitle="Skills required by your best-matching internships that you are missing (or only partly have)." />
      <Async state={state}>{(g) => !g.length ? <EmptyState icon={FiCheckCircle} title="No skill gaps found" text="Either you already match your top internships well, or you still need to add skills to your profile." action={<Link to="/student/skills" className="btn btn-primary">Add skills</Link>} /> : (
        <div className="space-y-6">
          <ChartCard title="Gaps by number of internships affected" subtitle="From your top 20 eligible matches"><div className="h-64"><ResponsiveContainer><BarChart data={g} layout="vertical" margin={{ left: 30 }}><CartesianGrid horizontal={false} stroke="#ECE8DF" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="skill" width={110} /><Tooltip /><Bar dataKey="internships" fill="#0E7C68" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
          <div className="grid gap-4 md:grid-cols-2">{g.map((x) => (
            <Card key={x.key} className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-sans font-semibold">{x.skill}</h3><SeverityBadge severity={x.severity} /></div><p className="mb-3 text-xs text-ink-soft">Needed by {x.internships} of your top matches</p><LearningPath learning={x.learning} /></Card>))}</div>
        </div>)}</Async>
    </div>
  );
}

export function Learning() {
  const state = useFetch(() => recApi.gaps().then((r) => r.data), []);
  return (
    <div><PageHeader title="Learning recommendations" subtitle="Structured paths for the skills that will unlock the most opportunities." />
      <Async state={state}>{(g) => { const withPath = g.filter((x) => x.learning?.steps?.length); return !withPath.length ? <EmptyState icon={FiBook} title="No learning paths needed" text="Once your matches show skill gaps, learning paths will appear here." /> : (
        <div className="grid gap-5 md:grid-cols-2">{withPath.map((x, i) => (
          <Card key={x.key} className="p-6"><div className="mb-1 flex items-center gap-2"><Badge tone="bg-ink text-white">Priority {i + 1}</Badge><SeverityBadge severity={x.severity} /></div><h3 className="mb-1 mt-2 font-display text-xl font-semibold">Learn {x.skill}</h3><p className="mb-4 text-sm text-ink-soft">Unlocks {x.internships} internship{x.internships > 1 ? 's' : ''} in your top matches</p><LearningPath learning={x.learning} /></Card>))}</div>); }}</Async>
    </div>
  );
}
