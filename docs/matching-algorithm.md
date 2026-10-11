# Matching & Skill-Gap Algorithm

Source: `backend/services/matchingService.js` (pure, no DB access) and `skillGapService.js`.

## Formula
```
overall = round( 100 × (0.40·S + 0.15·E + 0.15·D + 0.10·L + 0.10·T + 0.10·P) )
if eligibility = NOT_ELIGIBLE: overall = min(overall, 40)
confidence = Low (ineligible or <60) | Medium (60-79) | High (≥80)
```

## S - skill score
For each required skill *r* with importance weight w (High 3, Medium 2, Low 1):
* exact match (after alias normalisation, e.g. `reactjs`→`react`): credit = proficiency factor (Beginner 0.8, Intermediate 0.9, Advanced/Expert 1.0)
* related skill (graph in `utils/skillUtils.js`, e.g. Spring Boot ⇐ Java, React ⇐ JavaScript, MongoDB ⇐ MySQL): credit = 0.5
* otherwise missing: 0

`S_required = Σ(w·credit) / Σ(w)`; if preferred skills exist: `S = 0.9·S_required + 0.1·(preferred matched / preferred total)`.
Also reported: `skillMatchPercentage = exact matches / required count`.

## E - eligibility
Checks (only those the internship defines): minimum CGPA, branch (case/space-insensitive containment), graduation year, degree.
| Result | Condition | E |
|---|---|---|
| ELIGIBLE | all checks pass | 1.0 |
| PARTIALLY_ELIGIBLE | no failure but student data missing | 0.7 |
| PARTIALLY_ELIGIBLE | only failure is CGPA short by ≤ 0.5 | 0.5 |
| NOT_ELIGIBLE | anything else failing | 0 (+ cap 40) |

The API refuses applications to NOT_ELIGIBLE internships and returns reasons such as `Minimum CGPA required: 8.0. Your CGPA: 7.4`.

## D - domain interest
Interests = `profile.interests ∪ preferences.domains`. Internship text = domain + title + tags. Score is the best interest score: 1 if the interest phrase appears in the text; otherwise `|tokens(interest) ∩ tokens(text)| / |tokens(interest)|` after removing stop-words (developer, intern, …) and expanding synonyms (`mern → full, stack, react, node.js, mongodb`). No interests → 0.3 (neutral-low) with a hint to add some.

## L - location
| Situation | L |
|---|---|
| internship city is in preferred locations | 1.0 |
| remote internship and student accepts remote | 1.0 |
| remote internship, student did not ask for remote | 0.6 |
| hybrid and student accepts hybrid with no city list | 0.7 |
| otherwise | 0.1 |
| no preferences stated | 0.5 |
If the student listed work modes and this mode is not included, 0.2 is subtracted (floor 0.2).

## T - duration
`|preferred − actual|`: 0 → 1.0, 1 → 0.75, 2 → 0.5, more → 0.2; no preference → 0.5.

## P - project relevance
`Σ(1 if a project uses the required skill, 0.5 if it uses a related one) / number of required skills`; no projects → 0. The best-overlapping project is quoted in the explanation.

## Worked example
Student: Java (Advanced), React, MongoDB, Node.js (Intermediate); CGPA 8.2, CSE, 2026; interest Full Stack; Pune; Hybrid; 6 months; project *Expense Tracker* (React, Node.js, MongoDB).
Internship: Java Full Stack Intern - Java H, Spring Boot H, React H, MongoDB M, Git L; min CGPA 7; Pune, Hybrid, 6 months.

* S: weights 3+3+3+2+1 = 12. Java 3×1.0, Spring Boot 3×0.5 (related to Java), React 3×0.9, MongoDB 2×0.9, Git 0 → (3+1.5+2.7+1.8)/12 = 0.75
* E = 1.0, D = 1.0, L = 1.0, T = 1.0
* P: Java 0, Spring Boot 0, React 1, MongoDB 1, Git 0 → 2/5 = 0.4
* overall = 100×(0.40×0.75 + 0.15 + 0.15 + 0.10 + 0.10 + 0.10×0.4) = **84**

Explanation shown to the student: *3 of 5 required skills matched · Spring Boot: partial credit (related to Java) · You satisfy all eligibility requirements · Domain matches your interest · Pune matches · 6-month duration matches · Your project "Expense Tracker" uses relevant technologies (React, MongoDB) · Skill gaps: Git, Spring Boot*.

## Skill-gap classification
| Skill status | Importance | Severity |
|---|---|---|
| missing | High / Medium / Low | Critical / Moderate / Minor |
| partial | High / Medium / Low | Moderate / Minor / Minor |
Gaps are sorted Critical → Minor; each links to a stored learning path (`learningresources`).
The student-level view aggregates gaps over the top 20 eligible recommendations and ranks them by severity then by number of internships affected.

## Extensibility
`RecommendationEngine.score(profile, internship)` returns the same object shape for any engine. `WeightedRuleBasedEngine` is used today; `MLRecommendationEngine` deliberately throws "not implemented" - no machine learning is claimed. Select with `RECOMMENDATION_ENGINE`.
