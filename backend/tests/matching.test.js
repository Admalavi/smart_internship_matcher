const { computeMatch, checkEligibility, scoreLocation, scoreDuration, matchSkills } = require('../services/matchingService');

const internship = {
  title: 'Java Full Stack Developer Intern', domain: 'Java Development', tags: ['full stack'],
  requiredSkills: [
    { name: 'Java', importance: 'High' }, { name: 'Spring Boot', importance: 'High' },
    { name: 'React', importance: 'High' }, { name: 'MongoDB', importance: 'Medium' },
  ],
  preferredSkills: ['Docker'],
  eligibility: { minCGPA: 7, branches: ['Computer Science'], graduationYears: [2026, 2027], requiredDegree: 'B.Tech' },
  location: 'Pune', workMode: 'Hybrid', duration: 6, stipend: { min: 10000, max: 15000 },
};

const student = () => ({
  education: { degree: 'B.Tech', branch: 'Computer Science', graduationYear: 2026, cgpa: 8.2 },
  skills: [
    { name: 'Java', proficiency: 'Advanced' }, { name: 'React', proficiency: 'Intermediate' },
    { name: 'MongoDB', proficiency: 'Intermediate' }, { name: 'Node.js', proficiency: 'Intermediate' },
  ],
  projects: [{ title: 'Expense Tracker', technologies: ['React', 'Node.js', 'MongoDB', 'JWT'] }],
  interests: ['Full Stack Development'],
  preferences: { domains: [], locations: ['Pune', 'Mumbai'], workModes: ['Hybrid'], durationPreference: 6 },
});

describe('skill matching', () => {
  test('exact match', () => {
    const r = matchSkills(student(), internship);
    expect(r.matched.map((m) => m.name)).toEqual(expect.arrayContaining(['Java', 'React', 'MongoDB']));
  });
  test('partial match (Java -> Spring Boot)', () => {
    const r = matchSkills(student(), internship);
    expect(r.partial.map((p) => p.name)).toContain('Spring Boot');
    expect(r.partial[0].via).toBe('Java');
  });
  test('missing skill', () => {
    const s = student(); s.skills = [{ name: 'Figma', proficiency: 'Advanced' }];
    const r = matchSkills(s, internship);
    expect(r.missing.map((m) => m.name)).toContain('Java');
    expect(r.matched).toHaveLength(0);
  });
  test('aliases are normalised (reactjs == React)', () => {
    const s = student(); s.skills = [{ name: 'reactjs', proficiency: 'Advanced' }];
    expect(matchSkills(s, internship).matched.map((m) => m.name)).toContain('React');
  });
  test('high-importance skills weigh more than low ones', () => {
    const base = { ...internship, preferredSkills: [] };
    const s = student(); s.skills = [{ name: 'Java', proficiency: 'Expert' }];
    const hi = matchSkills(s, { ...base, requiredSkills: [{ name: 'Java', importance: 'High' }, { name: 'Docker', importance: 'Low' }] }).score;
    const lo = matchSkills(s, { ...base, requiredSkills: [{ name: 'Java', importance: 'Low' }, { name: 'Docker', importance: 'High' }] }).score;
    expect(hi).toBeGreaterThan(lo);
  });
});

describe('eligibility', () => {
  test('eligible', () => expect(checkEligibility(student(), internship).status).toBe('ELIGIBLE'));
  test('CGPA failure by a lot -> NOT_ELIGIBLE with reason', () => {
    const s = student(); s.education.cgpa = 5.5;
    const e = checkEligibility(s, internship);
    expect(e.status).toBe('NOT_ELIGIBLE');
    expect(e.reasons[0]).toMatch(/Minimum CGPA required: 7/);
  });
  test('CGPA just below -> PARTIALLY_ELIGIBLE', () => {
    const s = student(); s.education.cgpa = 6.8;
    expect(checkEligibility(s, internship).status).toBe('PARTIALLY_ELIGIBLE');
  });
  test('branch mismatch -> NOT_ELIGIBLE', () => {
    const s = student(); s.education.branch = 'Mechanical';
    expect(checkEligibility(s, internship).status).toBe('NOT_ELIGIBLE');
  });
  test('ineligible internships are capped below high-confidence', () => {
    const s = student(); s.education.branch = 'Mechanical';
    const m = computeMatch(s, internship);
    expect(m.overallScore).toBeLessThanOrEqual(40);
    expect(m.confidence).toBe('Low');
  });
});

describe('location / duration', () => {
  test('location match = 100', () => expect(scoreLocation(student(), internship).score).toBe(1));
  test('location mismatch is low', () => expect(scoreLocation(student(), { ...internship, location: 'Delhi', workMode: 'Onsite' }).score).toBeLessThan(0.3));
  test('remote preference matches remote internship', () => {
    const s = student(); s.preferences.locations = ['Remote']; s.preferences.workModes = ['Remote'];
    expect(scoreLocation(s, { ...internship, location: 'Remote', workMode: 'Remote' }).score).toBe(1);
  });
  test('duration exact = 100', () => expect(scoreDuration(student(), internship).score).toBe(1));
  test('duration off by 3 months is low', () => expect(scoreDuration(student(), { ...internship, duration: 3 }).score).toBe(0.2));
});

describe('overall computeMatch', () => {
  test('produces dynamic score, scores breakdown and explanation', () => {
    const m = computeMatch(student(), internship);
    expect(m.overallScore).toBeGreaterThan(60);
    expect(m.scores.locationPreference).toBe(100);
    expect(m.scores.durationPreference).toBe(100);
    expect(m.scores.projectRelevance).toBeGreaterThan(0);
    expect(m.explanation.length).toBeGreaterThan(3);
    expect(m.explanation.some((e) => /required skills matched/.test(e.text))).toBe(true);
  });
  test('better-fitting student scores higher', () => {
    const weak = student(); weak.skills = [{ name: 'Figma' }]; weak.projects = []; weak.interests = ['UI/UX'];
    expect(computeMatch(student(), internship).overallScore).toBeGreaterThan(computeMatch(weak, internship).overallScore);
  });
  test('weights sum to 1', () => {
    const w = require('../utils/constants').WEIGHTS;
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});
