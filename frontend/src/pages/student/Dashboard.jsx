import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiBriefcase, FiCheckCircle, FiStar, FiTarget, FiUser } from 'react-icons/fi';
import { studentApi } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Async, Badge, Button, Card, EmptyState, ProgressBar, StatCard } from '../../components/ui';
import { EligibilityBadge, ScoreRing, SeverityBadge } from '../../components/match';
import { useAuth } from '../../context/AuthContext';
import { deadlineInfo, greeting, scoreBg, scoreTone } from '../../utils/format';

export default function StudentDashboard() {
  const { user } = useAuth();
  const state = useFetch(() => studentApi.dashboard().then((r) => r.data), []);
  return (
    <Async state={state}>{(d) => (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold md:text-3xl">{greeting()}, {user.name.split(' ')[0]} 👋</h1><p className="text-sm text-ink-soft">Here is where you stand today.</p></div>
          <Link to="/student/recommendations" className="btn btn-primary">View all recommendations <FiArrowRight /></Link></div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FiTarget} label="Internship readiness" value={`${d.readiness}%`} />
          <StatCard icon={FiUser} label="Profile completion" value={`${d.profileCompletion}%`} tone="bg-amber-50 text-amber-600" />
          <StatCard icon={FiBriefcase} label="Applications" value={d.stats.totalApplications} hint={`${d.stats.successfulApplications} selected`} tone="bg-indigo-50 text-indigo-700" />
          <StatCard icon={FiStar} label="Avg. match of applications" value={d.stats.totalApplications ? `${d.stats.averageMatchScore}%` : '-'} tone="bg-rose-50 text-rose-600" />
        </div>

        {!d.hasSkills && <EmptyState icon={FiTarget} title="No recommendations yet" text="Complete your profile and add at least 3 technical skills to receive personalized internship recommendations." action={<Link to="/student/skills" className="btn btn-primary">Add skills</Link>} />}

        {d.deadlines.length > 0 && <Card className="p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><FiAlertTriangle className="text-amber-600" />Deadline alerts</h2>
          <div className="grid gap-2 md:grid-cols-2">{d.deadlines.map((x) => { const dl = deadlineInfo(x.deadline); return <Link key={x.internshipId} to={`/internships/${x.internshipId}`} className="flex items-center justify-between rounded-lg border border-line p-3 text-sm hover:border-ink-faint"><span className="font-medium">{x.title}</span><Badge tone={dl.tone}>{dl.dot} {dl.label}</Badge></Link>; })}</div></Card>}

        {d.hasSkills && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2"><h2 className="mb-4 text-lg font-semibold">Recommended opportunities</h2>
              {!d.topRecommendations.length ? <p className="text-sm text-ink-soft">No eligible opportunities right now. Check back after new postings.</p> :
                <div className="divide-y divide-line">{d.topRecommendations.map((r) => (
                  <Link key={r._id} to={`/internships/${r.internshipId}`} className="flex items-center gap-4 py-3 hover:bg-black/[.02]">
                    <ScoreRing value={r.overallScore} size={56} />
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{r.internship.title}</div><div className="truncate text-xs text-ink-soft">{r.internship.companyId?.companyName} · {r.internship.location} · {r.internship.duration} mo</div></div>
                    <EligibilityBadge status={r.eligibility.status !== 'ELIGIBLE' ? r.eligibility.status : null} />
                  </Link>))}</div>}
            </Card>
            <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Internship readiness</h2>
              <div className="flex justify-center"><ScoreRing value={d.readiness} size={130} label="ready" /></div>
              <p className="mt-4 text-center text-xs text-ink-soft">60% from your top-5 match scores, 40% from profile completeness.</p>
              {d.completionMissing.length > 0 && <div className="mt-4"><ProgressBar value={d.profileCompletion} /><ul className="mt-3 space-y-1 text-xs text-ink-soft">{d.completionMissing.slice(0, 3).map((m) => <li key={m}>• {m}</li>)}</ul><Link to="/student/profile/edit" className="mt-2 inline-block text-xs font-semibold text-brand-700">Improve profile →</Link></div>}
            </Card>
            <Card className="p-5 lg:col-span-2"><h2 className="mb-4 text-lg font-semibold">Skill strength</h2>
              {!d.skillStrength.length ? <p className="text-sm text-ink-soft">Add skills to see your strengths.</p> : <div className="space-y-3">{d.skillStrength.map((s) => (
                <div key={s.name} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm"><span className="truncate">{s.name}</span><ProgressBar value={s.strength} /><span className={`text-right font-semibold ${scoreTone(s.strength)}`}>{s.strength}%</span></div>))}</div>}
            </Card>
            <Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Top skill gaps</h2>
              {!d.topGaps.length ? <p className="flex items-center gap-2 text-sm text-brand-700"><FiCheckCircle />No gaps in your top matches.</p> : <ul className="space-y-3">{d.topGaps.map((g) => <li key={g.key} className="flex items-center justify-between text-sm"><span><b>{g.skill}</b><span className="ml-2 text-xs text-ink-faint">{g.internships} internships</span></span><SeverityBadge severity={g.severity} /></li>)}</ul>}
              <Link to="/student/skill-gaps" className="mt-4 inline-block text-xs font-semibold text-brand-700">See learning paths →</Link>
            </Card>
          </div>)}

        {d.stats.byStatus.length > 0 && <Card className="p-5"><h2 className="mb-3 text-lg font-semibold">Applications by status</h2><div className="flex flex-wrap gap-3">{d.stats.byStatus.map((s) => <div key={s.name} className="rounded-xl bg-black/5 px-4 py-2 text-sm"><b className="mr-1 text-lg">{s.count}</b>{s.name}</div>)}</div>
          {d.stats.mostAppliedDomains.length > 0 && <p className="mt-3 text-sm text-ink-soft">Most applied domain: <b>{d.stats.mostAppliedDomains[0].name}</b></p>}</Card>}
      </div>)}</Async>
  );
}
