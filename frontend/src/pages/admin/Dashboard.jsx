import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { FiAward, FiBriefcase, FiCheckCircle, FiClipboard, FiTarget, FiUsers } from 'react-icons/fi';
import { adminApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, ChartCard, NoData, PageHeader, StatCard } from '../../components/ui';
import { CHART_COLORS } from '../../constants';

export default function AdminDashboard() {
  const state = useFetch(() => adminApi.dashboard().then((r) => r.data), []);
  return (
    <div><PageHeader title="Admin dashboard" subtitle="Live platform statistics from MongoDB aggregation pipelines" actions={<Link to="/admin/analytics" className="btn btn-primary">Full analytics</Link>} />
      <Async state={state}>{(d) => (
        <div className="space-y-6">
          {d.pendingApprovals > 0 && <Link to="/admin/internships" className="block rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-600">{d.pendingApprovals} internship posting(s) waiting for approval →</Link>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={FiUsers} label="Total students" value={d.totalStudents} /><StatCard icon={FiBriefcase} label="Total companies" value={d.totalCompanies} tone="bg-indigo-50 text-indigo-700" />
            <StatCard icon={FiClipboard} label="Active internships" value={d.activeInternships} tone="bg-amber-50 text-amber-600" /><StatCard icon={FiCheckCircle} label="Total applications" value={d.totalApplications} />
            <StatCard icon={FiTarget} label="Average match score" value={`${d.averageMatchScore}%`} hint={`${d.totalRecommendations} recommendations stored`} tone="bg-rose-50 text-rose-600" /><StatCard icon={FiAward} label="Successful placements" value={d.successfulPlacements} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Internships by domain">{!d.internshipsByDomain.length ? <NoData /> : <div className="h-72"><ResponsiveContainer><BarChart data={d.internshipsByDomain} layout="vertical" margin={{ left: 40 }}><CartesianGrid horizontal={false} stroke="#ECE8DF" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#0E7C68" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>}</ChartCard>
            <ChartCard title="Applications by status">{!d.applicationsByStatus.length ? <NoData /> : <div className="h-72"><ResponsiveContainer><PieChart><Pie data={d.applicationsByStatus} dataKey="count" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>{d.applicationsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}</ChartCard>
          </div>
        </div>)}</Async>
    </div>
  );
}
