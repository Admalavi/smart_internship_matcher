import { Card } from '../components/ui';

const W = [['Skill match', 40], ['Eligibility', 15], ['Domain interest', 15], ['Location', 10], ['Duration', 10], ['Project relevance', 10]];
export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-4xl font-semibold">About the project</h1>
      <p className="mt-4 text-lg text-ink-soft">Smart Internship Matcher is a NoSQL-based personalised internship recommendation and skill-gap analysis system built as an M.Tech database mini-project. Traditional portals only search by keyword; this platform scores every opportunity against a student profile and explains the result.</p>
      <h2 className="mb-3 mt-10 text-2xl font-semibold">How the score is calculated</h2>
      <Card className="p-6"><div className="space-y-3">{W.map(([n, w]) => <div key={n} className="flex items-center gap-3 text-sm"><span className="w-40 text-ink-soft">{n}</span><div className="h-2 flex-1 rounded-full bg-black/5"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${w * 2.2}%` }} /></div><span className="w-10 text-right font-semibold">{w}%</span></div>)}</div>
        <p className="mt-5 text-sm text-ink-soft">Required skills are weighted by importance (High 3, Medium 2, Low 1). Related skills earn partial credit. Ineligible internships are capped at 40%. The engine is rule-based and transparent; it is not machine learning.</p></Card>
      <h2 className="mb-3 mt-10 text-2xl font-semibold">Why MongoDB</h2>
      <p className="text-ink-soft">Student profiles and internships are naturally nested documents (skills, projects, eligibility). Internships can carry different attributes, recommendations are cached as documents, and analytics use aggregation pipelines with $unwind, $group, $lookup and $bucket.</p>
    </div>
  );
}
