import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Card, ChartCard, NoData, PageHeader, StatCard } from '../../components/ui';
import { CHART_COLORS } from '../../constants';
import { MONTHS } from '../../utils/format';
import { FiAward, FiBriefcase, FiCheckCircle, FiTarget, FiUsers, FiClipboard } from 'react-icons/fi';

const HBar = ({ data, color = '#0E7C68', height = 280, dataKey = 'count' }) => !data?.length ? <NoData /> : (
  <div style={{ height }}><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 30 }}><CartesianGrid horizontal={false} stroke="#ECE8DF" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey={dataKey} fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>);
const Pie_ = ({ data }) => !data?.length ? <NoData /> : (
  <div className="h-64"><ResponsiveContainer><PieChart><Pie data={data} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>);

export function Analytics() {
  const state = useFetch(() => adminApi.analytics().then((r) => r.data), []);
  return (
    <div><PageHeader title="Platform analytics" subtitle="Every chart below is the result of a MongoDB aggregation pipeline." />
      <Async state={state}>{({ overview: o, charts: c, highlights: h }) => {
        const monthly = c.monthlyApplications.map((m) => ({ label: `${MONTHS[m.month - 1]} ${String(m.year).slice(2)}`, applications: m.count }));
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={FiUsers} label="Total students" value={o.totalStudents} /><StatCard icon={FiBriefcase} label="Total companies" value={o.totalCompanies} tone="bg-indigo-50 text-indigo-700" /><StatCard icon={FiClipboard} label="Active internships" value={o.activeInternships} tone="bg-amber-50 text-amber-600" />
              <StatCard icon={FiCheckCircle} label="Total applications" value={o.totalApplications} /><StatCard icon={FiTarget} label="Average match score" value={`${o.averageMatchScore}%`} tone="bg-rose-50 text-rose-600" /><StatCard icon={FiAward} label="Successful placements" value={o.successfulPlacements} />
            </div>
            <Card className="p-6"><h2 className="mb-4 text-lg font-semibold">Recommendation analytics</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">{[['Average recommendation score', `${h.averageRecommendationScore}%`], ['Most common skill gap', h.mostCommonSkillGap], ['Most demanded skill', h.mostDemandedSkill], ['Most popular domain', h.mostPopularDomain], ['Most preferred location', h.mostPreferredLocation], ['Most applied internship type', h.mostAppliedInternshipType]].map(([k, v]) => <div key={k}><dt className="text-ink-soft">{k}</dt><dd className="font-display text-xl font-semibold">{v || '-'}</dd></div>)}</dl></Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Internships by domain"><HBar data={c.internshipsByDomain} /></ChartCard>
              <ChartCard title="Most demanded skills" subtitle="$unwind → $group → $sort → $limit"><HBar data={c.skillDemand} color="#E59A14" /></ChartCard>
              <ChartCard title="Applications by status"><Pie_ data={c.applicationsByStatus} /></ChartCard>
              <ChartCard title="Popular locations"><HBar data={c.popularLocations} color="#16213A" /></ChartCard>
              <ChartCard title="Monthly applications" subtitle="Last 12 months">{!monthly.length ? <NoData /> : <div className="h-64"><ResponsiveContainer><AreaChart data={monthly}><CartesianGrid vertical={false} stroke="#ECE8DF" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="applications" stroke="#0E7C68" fill="#D1F3EA" /></AreaChart></ResponsiveContainer></div>}</ChartCard>
              <ChartCard title="Recommendation score distribution" subtitle="$bucket over all stored recommendations">{!c.scoreDistribution.length ? <NoData /> : <div className="h-64"><ResponsiveContainer><BarChart data={c.scoreDistribution}><CartesianGrid vertical={false} stroke="#ECE8DF" /><XAxis dataKey="range" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0E7C68" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}</ChartCard>
              <ChartCard title="Top skill gaps" subtitle="Missing skills across eligible recommendations"><HBar data={c.topSkillGaps} color="#D6453D" /></ChartCard>
              <ChartCard title="Availability by work mode"><Pie_ data={c.workModes} /></ChartCard>
            </div>
          </div>); }}</Async>
    </div>
  );
}

export function SkillAnalytics() {
  const state = useFetch(() => adminApi.analytics().then((r) => r.data.charts), []);
  return (
    <div><PageHeader title="Skill analytics" subtitle="What employers demand versus where students fall short." />
      <Async state={state}>{(c) => (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Skill demand (internships requiring each skill)"><HBar data={c.skillDemand} color="#E59A14" /></ChartCard>
            <ChartCard title="Skill gaps (times a skill was missing in a recommendation)"><HBar data={c.topSkillGaps} color="#D6453D" /></ChartCard>
          </div>
          <Card className="overflow-x-auto"><div className="p-5 pb-0"><h3 className="font-semibold">Demand vs. gap</h3><p className="text-xs text-ink-soft">Skills ranked by gap size, with the number of students affected</p></div>
            <table className="mt-3 w-full min-w-[30rem]"><thead className="border-y border-line bg-black/[.02]"><tr><th className="th">Skill</th><th className="th">Missing in recommendations</th><th className="th">Students affected</th></tr></thead><tbody className="divide-y divide-line">{c.topSkillGaps.map((g) => <tr key={g.name}><td className="td font-semibold">{g.name}</td><td className="td">{g.count}</td><td className="td">{g.students}</td></tr>)}</tbody></table></Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Student interests"><HBar data={c.studentInterests} color="#0E7C68" /></ChartCard>
            <ChartCard title="Students' preferred locations"><HBar data={c.preferredLocations} color="#16213A" /></ChartCard>
          </div>
        </div>)}</Async>
    </div>
  );
}
