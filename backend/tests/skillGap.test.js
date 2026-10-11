const { computeMatch } = require('../services/matchingService');
const { buildGap } = require('../services/skillGapService');

const internship = {
  title: 'DevOps Intern', domain: 'DevOps', requiredSkills: [
    { name: 'Docker', importance: 'High' }, { name: 'AWS', importance: 'Medium' }, { name: 'Terraform', importance: 'Low' }, { name: 'Linux', importance: 'High' },
  ], eligibility: {}, location: 'Pune', workMode: 'Onsite', duration: 3,
};

test('classifies Critical / Moderate / Minor and downgrades partial matches', () => {
  const profile = { education: {}, skills: [{ name: 'Azure', proficiency: 'Intermediate' }], projects: [], preferences: {}, interests: [] };
  const gap = buildGap(computeMatch(profile, internship));
  expect(gap.critical).toEqual(expect.arrayContaining(['Docker', 'Linux']));
  expect(gap.items.find((i) => i.skill === 'AWS').type).toBe('partial');
  expect(gap.items.find((i) => i.skill === 'AWS').severity).toBe('Minor');
  expect(gap.minor).toContain('Terraform');
});

test('no gaps when everything matches', () => {
  const profile = { education: {}, skills: internship.requiredSkills.map((s) => ({ name: s.name, proficiency: 'Advanced' })), projects: [], preferences: {}, interests: [] };
  expect(buildGap(computeMatch(profile, internship)).totalGaps).toBe(0);
});
