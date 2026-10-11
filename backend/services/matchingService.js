/**
 * Matching service: pure functions (no DB access) that score ONE student profile
 * against ONE internship. Every number comes from actual profile/internship data.
 *
 *   overall = 0.40*skill + 0.15*eligibility + 0.15*domain + 0.10*location
 *           + 0.10*duration + 0.10*projects            (each component in [0,1])
 */
const {
  WEIGHTS, IMPORTANCE_WEIGHT, PROFICIENCY_CREDIT, PARTIAL_CREDIT, INELIGIBLE_SCORE_CAP,
} = require('../utils/constants');
const { norm, normalizeSkill, relatedSkillsFor } = require('../utils/skillUtils');

const pct = (x) => Math.round(Math.max(0, Math.min(1, x)) * 100);
const plain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc || {});

/* ------------------------------ SKILLS ------------------------------ */
function matchSkills(profile, internship) {
  const studentMap = new Map();
  (profile.skills || []).forEach((s) => {
    const k = normalizeSkill(s.name);
    if (k && !studentMap.has(k)) studentMap.set(k, s);
  });

  const required = internship.requiredSkills || [];
  const matched = [];
  const partial = [];
  const missing = [];
  let earned = 0;
  let possible = 0;

  for (const r of required) {
    const key = normalizeSkill(r.name);
    const importance = r.importance || 'Medium';
    const w = IMPORTANCE_WEIGHT[importance] || 2;
    possible += w;
    if (studentMap.has(key)) {
      const s = studentMap.get(key);
      earned += w * (PROFICIENCY_CREDIT[s.proficiency] ?? 0.9);
      matched.push({ name: r.name, importance, proficiency: s.proficiency });
      continue;
    }
    const via = relatedSkillsFor(key).find((x) => studentMap.has(x));
    if (via) {
      earned += w * PARTIAL_CREDIT;
      partial.push({ name: r.name, importance, via: studentMap.get(via).name });
    } else {
      missing.push({ name: r.name, key, importance });
    }
  }

  const requiredScore = possible ? earned / possible : 1;
  const preferred = internship.preferredSkills || [];
  const prefHit = preferred.filter((p) => studentMap.has(normalizeSkill(p))).length;
  const preferredScore = preferred.length ? prefHit / preferred.length : null;
  const score = preferredScore === null ? requiredScore : 0.9 * requiredScore + 0.1 * preferredScore;

  return {
    score,
    matched,
    partial,
    missing,
    totalRequired: required.length,
    skillMatchPercentage: required.length ? Math.round((matched.length / required.length) * 100) : 100,
    preferredMatched: prefHit,
    preferredTotal: preferred.length,
  };
}

/* ---------------------------- ELIGIBILITY ---------------------------- */
const slug = (s) => norm(s).replace(/[^a-z0-9]/g, '');
const branchMatches = (a, b) => {
  const x = slug(a);
  const y = slug(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

function checkEligibility(profile, internship) {
  const edu = profile.education || {};
  const el = internship.eligibility || {};
  const checks = [];

  if (el.minCGPA) {
    if (edu.cgpa == null) checks.push({ name: 'CGPA', status: 'unknown', reason: `Minimum CGPA ${el.minCGPA} required - add your CGPA to your profile` });
    else if (edu.cgpa >= el.minCGPA) checks.push({ name: 'CGPA', status: 'pass', reason: `CGPA ${edu.cgpa} meets minimum ${el.minCGPA}` });
    else checks.push({ name: 'CGPA', status: 'fail', reason: `Minimum CGPA required: ${el.minCGPA}. Your CGPA: ${edu.cgpa}`, gap: +(el.minCGPA - edu.cgpa).toFixed(2) });
  }
  if (el.branches && el.branches.length) {
    if (!edu.branch) checks.push({ name: 'Branch', status: 'unknown', reason: 'Branch requirement exists - add your branch' });
    else if (el.branches.some((b) => branchMatches(b, edu.branch))) checks.push({ name: 'Branch', status: 'pass', reason: `Branch ${edu.branch} is eligible` });
    else checks.push({ name: 'Branch', status: 'fail', reason: `Open to ${el.branches.join(', ')}. Your branch: ${edu.branch}` });
  }
  if (el.graduationYears && el.graduationYears.length) {
    if (!edu.graduationYear) checks.push({ name: 'Graduation year', status: 'unknown', reason: 'Add your graduation year' });
    else if (el.graduationYears.includes(edu.graduationYear)) checks.push({ name: 'Graduation year', status: 'pass', reason: `Graduation year ${edu.graduationYear} accepted` });
    else checks.push({ name: 'Graduation year', status: 'fail', reason: `Open to ${el.graduationYears.join(', ')} graduates. Yours: ${edu.graduationYear}` });
  }
  if (el.requiredDegree && norm(el.requiredDegree) !== 'any') {
    if (!edu.degree) checks.push({ name: 'Degree', status: 'unknown', reason: 'Add your degree' });
    else if (slug(edu.degree) === slug(el.requiredDegree)) checks.push({ name: 'Degree', status: 'pass', reason: `Degree ${edu.degree} accepted` });
    else checks.push({ name: 'Degree', status: 'fail', reason: `Requires ${el.requiredDegree}. Your degree: ${edu.degree}` });
  }

  const fails = checks.filter((c) => c.status === 'fail');
  const unknown = checks.filter((c) => c.status === 'unknown');
  let status;
  let score;
  if (!fails.length && !unknown.length) { status = 'ELIGIBLE'; score = 1; }
  else if (!fails.length) { status = 'PARTIALLY_ELIGIBLE'; score = 0.7; }
  else if (fails.length === 1 && fails[0].name === 'CGPA' && fails[0].gap <= 0.5) { status = 'PARTIALLY_ELIGIBLE'; score = 0.5; }
  else { status = 'NOT_ELIGIBLE'; score = 0; }

  return { status, score, checks, reasons: [...fails, ...unknown].map((c) => c.reason) };
}

/* ------------------------------ DOMAIN ------------------------------ */
const STOP = new Set(['developer', 'development', 'intern', 'internship', 'engineer', 'engineering', 'and', 'the', 'of', 'for', 'a', 'junior', 'trainee', 'associate', 'in', 'with']);
const SYN = {
  mern: ['full', 'stack', 'react', 'node.js', 'mongodb', 'web'],
  mean: ['full', 'stack', 'angular', 'node.js', 'mongodb', 'web'],
  fullstack: ['full', 'stack'],
  frontend: ['front', 'end'],
  backend: ['back', 'end'],
  ml: ['machine', 'learning'],
  ai: ['artificial', 'intelligence', 'machine', 'learning'],
  web: ['web'],
  ux: ['ui', 'ux', 'design'],
  design: ['ui', 'ux', 'design'],
  cloud: ['cloud', 'aws', 'azure'],
  security: ['cybersecurity', 'security'],
  cybersecurity: ['cybersecurity', 'security'],
  devops: ['devops', 'cloud'],
  android: ['mobile', 'android'],
  ios: ['mobile', 'ios'],
  flutter: ['mobile', 'flutter'],
  data: ['data'],
};

const tokenize = (text) => {
  const raw = norm(text).split(/[^a-z0-9.+#]+/).filter((t) => t && !STOP.has(t));
  const set = new Set();
  raw.forEach((t) => {
    set.add(t);
    (SYN[t] || []).forEach((x) => set.add(x));
  });
  return set;
};

function scoreDomain(profile, internship) {
  const interests = [...(profile.interests || []), ...((profile.preferences || {}).domains || [])].filter(Boolean);
  if (!interests.length) return { score: 0.3, matchedInterest: null, note: 'no-interests' };
  const text = [internship.domain, internship.title, ...(internship.tags || [])].join(' ');
  const normText = norm(text);
  const target = tokenize(text);
  let best = 0;
  let bestInterest = null;
  for (const interest of interests) {
    let s;
    if (normText.includes(norm(interest))) s = 1;
    else {
      const it = tokenize(interest);
      if (!it.size) continue;
      let hit = 0;
      it.forEach((t) => { if (target.has(t)) hit += 1; });
      s = hit / it.size;
    }
    if (s > best) { best = s; bestInterest = interest; }
  }
  return { score: best, matchedInterest: bestInterest };
}

/* ----------------------------- LOCATION ----------------------------- */
function scoreLocation(profile, internship) {
  const prefs = profile.preferences || {};
  const locs = (prefs.locations || []).map(norm);
  const modes = prefs.workModes || [];
  const loc = norm(internship.location);
  const isRemote = internship.workMode === 'Remote' || loc === 'remote';
  const wantsRemote = locs.includes('remote') || modes.includes('Remote');
  if (!locs.length && !modes.length) return { score: 0.5, reason: 'no-preference' };

  let score;
  let reason;
  if (locs.includes(loc)) { score = 1; reason = 'location'; }
  else if (isRemote && wantsRemote) { score = 1; reason = 'remote'; }
  else if (isRemote) { score = 0.6; reason = 'remote-possible'; }
  else if (internship.workMode === 'Hybrid' && modes.includes('Hybrid') && locs.length === 0) { score = 0.7; reason = 'hybrid'; }
  else { score = 0.1; reason = 'mismatch'; }

  if (modes.length && internship.workMode && !modes.includes(internship.workMode) && score > 0.2) score = Math.max(0.2, score - 0.2);
  return { score, reason };
}

/* ----------------------------- DURATION ----------------------------- */
function scoreDuration(profile, internship) {
  const pref = (profile.preferences || {}).durationPreference;
  if (!pref) return { score: 0.5, reason: 'no-preference' };
  const diff = Math.abs(pref - internship.duration);
  const score = diff === 0 ? 1 : diff === 1 ? 0.75 : diff === 2 ? 0.5 : 0.2;
  return { score, reason: diff === 0 ? 'exact' : 'differs', diff };
}

/* ------------------------- PROJECT RELEVANCE ------------------------- */
function scoreProjects(profile, internship) {
  const projects = profile.projects || [];
  const required = internship.requiredSkills || [];
  if (!projects.length || !required.length) return { score: 0, relevantProjects: [] };
  const techSet = new Set();
  const perProject = projects.map((p) => {
    const techs = (p.technologies || []).map(normalizeSkill);
    techs.forEach((t) => techSet.add(t));
    return { title: p.title, techs };
  });
  let earned = 0;
  required.forEach((r) => {
    const k = normalizeSkill(r.name);
    if (techSet.has(k)) earned += 1;
    else if (relatedSkillsFor(k).some((x) => techSet.has(x))) earned += 0.5;
  });
  const reqKeys = new Map(required.map((r) => [normalizeSkill(r.name), r.name]));
  const relevantProjects = perProject
    .map((p) => ({ title: p.title, overlap: p.techs.filter((t) => reqKeys.has(t)).map((t) => reqKeys.get(t)) }))
    .filter((p) => p.overlap.length)
    .sort((a, b) => b.overlap.length - a.overlap.length);
  return { score: earned / required.length, relevantProjects };
}

/* --------------------------- EXPLANATION --------------------------- */
function buildExplanation({ skills, elig, domain, loc, dur, proj }, profile, internship) {
  const out = [];
  const add = (type, text) => out.push({ type, text });
  const total = skills.totalRequired;
  if (total) {
    add(skills.matched.length / total >= 0.5 ? 'positive' : 'warning', `${skills.matched.length} of ${total} required skills matched`);
    skills.partial.forEach((p) => add('info', `${p.name}: partial credit - related to your ${p.via} skill`));
  }
  if (elig.status === 'ELIGIBLE') add('positive', elig.checks.length ? 'You satisfy all eligibility requirements' : 'No restrictive eligibility criteria');
  else if (elig.status === 'PARTIALLY_ELIGIBLE') elig.reasons.forEach((r) => add('warning', `Partially eligible: ${r}`));
  else elig.reasons.forEach((r) => add('negative', `Not eligible: ${r}`));
  if (domain.score >= 0.7) add('positive', `Domain matches your interest in "${domain.matchedInterest}"`);
  else if (domain.note === 'no-interests') add('info', 'Add career interests to improve domain matching');
  else if (domain.score < 0.3) add('warning', 'Domain differs from your stated interests');
  if (loc.reason === 'location') add('positive', `${internship.location} matches your preferred location`);
  else if (loc.reason === 'remote') add('positive', 'Remote work matches your preference');
  else if (loc.reason === 'remote-possible') add('info', 'Remote opportunity - location is flexible');
  else if (loc.reason === 'mismatch') add('warning', `${internship.location} is not in your preferred locations`);
  if (dur.reason === 'exact') add('positive', `${internship.duration}-month duration matches your preference`);
  else if (dur.reason === 'differs') add('warning', `Duration is ${internship.duration} months (you prefer ${profile.preferences.durationPreference})`);
  if (proj.relevantProjects.length) {
    const p = proj.relevantProjects[0];
    add('positive', `Your project "${p.title}" uses relevant technologies (${p.overlap.join(', ')})`);
  }
  const stip = (profile.preferences || {}).minStipend;
  if (stip && internship.stipend && internship.stipend.max < stip) add('warning', `Stipend (up to Rs.${internship.stipend.max}) is below your minimum of Rs.${stip}`);
  const gaps = [...skills.missing.map((m) => m.name), ...skills.partial.map((p) => p.name)];
  if (gaps.length) add('warning', `Skill gaps: ${gaps.join(', ')}`);
  return out;
}

/* ---------------------------- MAIN ENTRY ---------------------------- */
function computeMatch(profileInput, internshipInput) {
  const profile = plain(profileInput);
  const internship = plain(internshipInput);
  profile.preferences = profile.preferences || {};

  const skills = matchSkills(profile, internship);
  const elig = checkEligibility(profile, internship);
  const domain = scoreDomain(profile, internship);
  const loc = scoreLocation(profile, internship);
  const dur = scoreDuration(profile, internship);
  const proj = scoreProjects(profile, internship);

  const components = {
    skillMatch: skills.score,
    eligibility: elig.score,
    domainInterest: domain.score,
    locationPreference: loc.score,
    durationPreference: dur.score,
    projectRelevance: proj.score,
  };
  let overall = Object.keys(WEIGHTS).reduce((sum, k) => sum + WEIGHTS[k] * components[k], 0) * 100;
  if (elig.status === 'NOT_ELIGIBLE') overall = Math.min(overall, INELIGIBLE_SCORE_CAP);
  overall = Math.round(overall);

  const scores = {};
  Object.keys(components).forEach((k) => { scores[k] = pct(components[k]); });
  const confidence = elig.status === 'NOT_ELIGIBLE' ? 'Low' : overall >= 80 ? 'High' : overall >= 60 ? 'Medium' : 'Low';

  return {
    overallScore: overall,
    scores,
    skillMatchPercentage: skills.skillMatchPercentage,
    matchedSkills: skills.matched,
    partialSkills: skills.partial,
    missingSkills: skills.missing,
    eligibility: { status: elig.status, reasons: elig.reasons, checks: elig.checks },
    confidence,
    explanation: buildExplanation({ skills, elig, domain, loc, dur, proj }, profile, internship),
    relevantProjects: proj.relevantProjects,
  };
}

module.exports = { computeMatch, matchSkills, checkEligibility, scoreDomain, scoreLocation, scoreDuration, scoreProjects };
