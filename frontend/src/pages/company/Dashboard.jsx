import { Link } from 'react-router-dom';
import { FiAward, FiBriefcase, FiCalendar, FiStar, FiUserCheck, FiUsers } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { companyApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Card, ChartCard, NoData, PageHeader, StatCard } from '../../components/ui';

export default function CompanyDashboard() {
  const state = useFetch(() => companyApi.dashboard().then((r) => r.data), []);
  return (
    <div><PageHeader title="Company dashboard" subtitle="Applications, shortlisting and candidate quality at a glance." actions={<Link to="/company/internships/new" className="btn btn-primary">Post internship</Link>} />
      <Async state={state}>{(d) => (
        <div className="space-y-6">
          {!d.company.verified && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-600">Your company is awaiting verification by the placement office.</p>}
          {d.pendingApproval > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-600">{d.pendingApproval} internship(s) are waiting for admin approval before students can see them.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={FiBriefcase} label="Active internships" value={d.activeInternships} /><StatCard icon={FiUsers} label="Applications" value={d.applications} tone="bg-indigo-50 text-indigo-700" />
            <StatCard icon={FiStar} label="Shortlisted" value={d.shortlisted} tone="bg-amber-50 text-amber-600" /><StatCard icon={FiCalendar} label="Interviews" value={d.interviews} tone="bg-rose-50 text-rose-600" />
            <StatCard icon={FiAward} label="Selected" value={d.selected} hint={`${d.shortlistingRate}% shortlisting rate`} />
          </div>
          <ChartCard title="Applications per internship" subtitle="Applications, shortlisted and average candidate match score">{!d.perInternship.length ? <NoData text="No applications yet" /> : <div className="h-72"><ResponsiveContainer><BarChart data={d.perInternship} margin={{ bottom: 40 }}><CartesianGrid vertical={false} stroke="#ECE8DF" /><XAxis dataKey="title" interval={0} angle={-20} textAnchor="end" height={70} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend verticalAlign="top" /><Bar dataKey="applications" fill="#0E7C68" radius={[4, 4, 0, 0]} /><Bar dataKey="shortlisted" fill="#E59A14" radius={[4, 4, 0, 0]} /><Bar dataKey="avgMatch" name="avg match %" fill="#16213A" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}</ChartCard>
          <Card className="p-5"><h3 className="mb-3 font-semibold">Pipeline</h3><div className="flex flex-wrap gap-3">{d.byStatus.map((s) => <div key={s.name} className="rounded-xl bg-black/5 px-4 py-2 text-sm"><b className="mr-1 text-lg">{s.count}</b>{s.name}</div>)}{!d.byStatus.length && <NoData text="No applications yet" />}</div></Card>
        </div>)}</Async>
    </div>
  );
}
